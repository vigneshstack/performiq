import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/assessments
// Returns all assessments assigned to the currently authenticated user.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Resolve the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Fetch assessments that have at least one assignment for this user's
    // employee record. The query joins through assessment_assignments so that
    // only assessments the user participates in are returned.
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(
        `
        id,
        title,
        description,
        status,
        due_date,
        created_at,
        template_id,
        assessment_templates (
          id,
          title
        ),
        assessment_assignments!inner (
          id,
          status,
          role,
          employee_id
        )
        `,
      )
      .eq('assessment_assignments.employee_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/assessments]', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: assessments }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/assessments] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/assessments
// Creates a new assessment from a template.
// Expected body:
//   {
//     template_id: string,
//     title: string,
//     description?: string,
//     due_date?: string (ISO 8601),
//     assignees: Array<{ employee_id: string; role: 'self' | 'manager' | 'peer' | 'direct_report' }>
//   }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Resolve the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const {
      template_id,
      title,
      description,
      due_date,
      assignees,
    } = body as {
      template_id: string;
      title: string;
      description?: string;
      due_date?: string;
      assignees?: Array<{ employee_id: string; role: string }>;
    };

    // Validate required fields
    if (!template_id || typeof template_id !== 'string') {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 },
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 },
      );
    }

    // Insert the assessment record
    const { data: assessment, error: insertError } = await supabase
      .from('assessments')
      .insert({
        template_id,
        title: title.trim(),
        description: description?.trim() ?? null,
        due_date: due_date ?? null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/assessments] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 },
      );
    }

    // Create assignments if provided
    if (Array.isArray(assignees) && assignees.length > 0) {
      const assignmentRows = assignees.map((a) => ({
        assessment_id: assessment.id,
        employee_id: a.employee_id,
        role: a.role,
        status: 'pending',
      }));

      const { error: assignError } = await supabase
        .from('assessment_assignments')
        .insert(assignmentRows);

      if (assignError) {
        console.error('[POST /api/assessments] Assignment insert error:', assignError);
        // Assessment was created; return partial success with a warning
        return NextResponse.json(
          {
            data: assessment,
            warning: 'Assessment created but some assignments failed',
          },
          { status: 207 },
        );
      }
    }

    return NextResponse.json({ data: assessment }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/assessments] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

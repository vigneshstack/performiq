import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/notifications
// Returns notifications for the currently authenticated user.
// Supports query parameters:
//   ?unread=true   — return only unread notifications
//   ?limit=N       — limit number of results (default 50, max 100)
//   ?offset=N      — pagination offset (default 0)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('[GET /api/notifications]', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data: notifications,
        meta: {
          total: count ?? 0,
          limit,
          offset,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[GET /api/notifications] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/notifications
// Marks one or more notifications as read for the current user.
//
// Body options:
//   { ids: string[] }   — mark specific notifications as read
//   { all: true }       — mark ALL unread notifications as read
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { ids, all } = body as { ids?: string[]; all?: boolean };

    if (!all && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json(
        { error: 'Provide either { ids: string[] } or { all: true }' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if (all === true) {
      // Mark every unread notification for this user as read
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('[PATCH /api/notifications] Mark-all error:', error);
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: 'All notifications marked as read' },
        { status: 200 },
      );
    }

    // Validate all ids are strings
    const validIds = (ids as string[]).filter(
      (id) => typeof id === 'string' && id.trim().length > 0,
    );

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid notification IDs provided' },
        { status: 400 },
      );
    }

    // Mark specific notifications as read.
    // The user_id check ensures users can only mark their own notifications.
    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .in('id', validIds)
      .is('read_at', null) // Only update currently unread notifications
      .select('id');

    if (error) {
      console.error('[PATCH /api/notifications] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: `${updated?.length ?? 0} notification(s) marked as read`,
        data: updated,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[PATCH /api/notifications] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

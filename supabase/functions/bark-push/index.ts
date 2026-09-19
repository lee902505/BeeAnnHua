import { withSupabase } from 'npm:@supabase/server@^1';

const allowedGroups: Record<string, string> = {
  '星辰日记·每日运势': '🌟 星辰日记｜每日运势',
  '星辰日记·塔罗牌': '🔮 星辰日记｜塔罗结果',
  '星辰日记·星盘': '✨ 星辰日记｜本命星盘'
};

const encoder = new TextEncoder();

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ok:false}, {status:405});

    const deviceKey = Deno.env.get('BARK_DEVICE_KEY');
    if (!deviceKey) return Response.json({ok:false, reason:'not-configured'}, {status:503});

    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ok:false}, {status:401});

    let input: Record<string, unknown>;
    try {
      input = await req.json();
    } catch {
      return Response.json({ok:false}, {status:400});
    }

    const group = String(input?.group ?? '');
    const body = String(input?.body ?? '');
    const subtitle = String(input?.subtitle ?? '');
    if (!Object.hasOwn(allowedGroups, group) ||
        !body.trim() || encoder.encode(body).length > 2800 ||
        encoder.encode(subtitle).length > 180) {
      return Response.json({ok:false}, {status:400});
    }

    const {data: allowed, error: quotaError} = await ctx.supabaseAdmin.rpc(
      'reserve_bark_push', {p_user_id:userId}
    );
    if (quotaError) return Response.json({ok:false, reason:'quota-unavailable'}, {status:503});
    if (!allowed) return Response.json({ok:false, reason:'rate-limited'}, {status:429});

    try {
      const response = await fetch(`https://api.day.app/${encodeURIComponent(deviceKey)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json; charset=utf-8'},
        body:JSON.stringify({
          title:allowedGroups[group],
          subtitle,
          body,
          group,
          level:'active',
          isArchive:'1'
        }),
        signal:AbortSignal.timeout(10000)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || (result?.code != null && result.code !== 200)) {
        return Response.json({ok:false, reason:'delivery-failed'}, {status:502});
      }
      return Response.json({ok:true});
    } catch {
      return Response.json({ok:false, reason:'delivery-failed'}, {status:502});
    }
  })
};

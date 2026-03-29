export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const jsonResponse = (data, init = {}) =>
      new Response(JSON.stringify(data, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
        status: init.status || 200,
      })

    const BPC_MEMBERS = new Set([
      'ipsos',
      'orb international',
      'savanta',
      'verian',
      'yougov',
      'bmg research',
      'censuswide',
      'deltapoll',
      'electoral calculus',
      'find out now',
      'focaldata',
      'hanbury strategy',
      'j.l. partners',
      'lucidtalk',
      'more in common',
      'norstat',
      'obsurvant',
      'opinium',
      'public first',
      'redfield & wilton strategies',
      'survation',
      'techne',
      'whitestone insight',
      'yonder consulting',
    ])

    function norm(value) {
      return String(value || '').trim().toLowerCase()
    }

    function titleCase(value) {
      return String(value || '').trim().replace(/\s+/g, ' ')
    }

    function safeNumber(value) {
      if (value === null || value === undefined || value === '') return null
      const raw = String(value).trim().replace(/%/g, '').replace(/,/g, '')
      if (!raw) return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
    }

    function formatDateRange(start, end, fallback) {
      if (fallback) return String(fallback)
      if (start && end && start !== end) return `${start} – ${end}`
      return start || end || null
    }

    function makePollId(pollster, publishedAt, fieldworkEnd, idx = 0) {
      return `${norm(pollster).replace(/[^a-z0-9]+/g, '-')}-${publishedAt || fieldworkEnd || 'undated'}-${idx}`
    }

    function normalizePollRecord(row, idx = 0) {
      if (!row || typeof row !== 'object') return null

      const pollster =
        row.pollster ||
        row.pollsterName ||
        row.house ||
        row.company ||
        row.organisation ||
        row.organization ||
        ''

      if (!pollster) return null

      const fieldworkStart =
        row.fieldworkStart ||
        row.startDate ||
        row.fieldwork_from ||
        row.from ||
        null

      const fieldworkEnd =
        row.fieldworkEnd ||
        row.endDate ||
        row.fieldwork_to ||
        row.to ||
        null

      const publishedAt =
        row.publishedAt ||
        row.publishDate ||
        row.published ||
        row.releaseDate ||
        row.datePublished ||
        null

      return {
        id: row.id || makePollId(pollster, publishedAt, fieldworkEnd, idx),
        pollster: titleCase(pollster),
        isBpcMember:
          row.isBpcMember != null ? !!row.isBpcMember : BPC_MEMBERS.has(norm(pollster)),
        fieldworkStart,
        fieldworkEnd,
        publishedAt,
        date: row.date || formatDateRange(fieldworkStart, fieldworkEnd, null),
        sample: safeNumber(row.sample || row.sampleSize || row.n),
        method: row.method || row.methodology || null,
        mode: row.mode || row.collectionMode || null,
        commissioner: row.commissioner || row.client || null,
        sourceUrl: row.sourceUrl || row.url || row.link || null,
        source: row.source || row.sourceLabel || null,
        ref: safeNumber(row.ref ?? row.reform ?? row.reform_uk),
        lab: safeNumber(row.lab ?? row.labour),
        con: safeNumber(row.con ?? row.conservative),
        grn: safeNumber(row.grn ?? row.green),
        ld: safeNumber(
          row.ld ?? row.libdem ?? row.lib_dem ?? row.liberal_democrats
        ),
        rb: safeNumber(row.rb ?? row.restore_britain),
        snp: safeNumber(row.snp),
      }
    }

    function sortPollsNewestFirst(polls) {
      const score = (p) => p.publishedAt || p.fieldworkEnd || p.fieldworkStart || ''
      return [...polls].sort((a, b) => score(b).localeCompare(score(a)))
    }

    function mergePolls(existingPolls, incomingPolls) {
      const map = new Map()

      for (const poll of existingPolls || []) {
        const normal = normalizePollRecord(poll)
        if (normal?.id) map.set(normal.id, normal)
      }

      for (const poll of incomingPolls || []) {
        const normal = normalizePollRecord(poll)
        if (normal?.id) map.set(normal.id, normal)
      }

      return sortPollsNewestFirst([...map.values()])
    }

    async function tableExists(tableName) {
      const res = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      )
        .bind(tableName)
        .first()
      return !!res
    }

    async function loadMeta() {
      const meta = await env.DB.prepare('SELECT key, value FROM meta').all()
      const metaObj = {}
      for (const row of meta.results || []) {
        metaObj[row.key] = row.value
      }
      return metaObj
    }

    async function loadContentSection(section) {
      const hasContent = await tableExists('content')
      if (!hasContent) return null

      const row = await env.DB.prepare(
        'SELECT section, data, updated_at FROM content WHERE section = ? LIMIT 1'
      )
        .bind(section)
        .first()

      if (!row) return null

      try {
        return row.data ? JSON.parse(row.data) : null
      } catch {
        return null
      }
    }

    async function saveContentSection(section, payload) {
      const hasContent = await tableExists('content')
      if (!hasContent) {
        throw new Error('Missing D1 table: content')
      }

      await env.DB.prepare(
        `INSERT INTO content (section, data, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(section) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`
      )
        .bind(section, JSON.stringify(payload ?? null), new Date().toISOString())
        .run()
    }

    async function ytFetch(urlValue, apiKey) {
      const res = await fetch(urlValue, {
        headers: { Accept: 'application/json' },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`YouTube API ${res.status}: ${text}`)
      }

      return res.json()
    }

    async function getChannelIdFromHandle(apiKey, handle = '@UKParliament') {
      const endpoint =
        `https://www.googleapis.com/youtube/v3/channels?` +
        `part=id,contentDetails,snippet&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`

      const data = await ytFetch(endpoint, apiKey)
      const item = data?.items?.[0]
      if (!item?.id) throw new Error('Could not resolve UK Parliament YouTube channel')

      return {
        channelId: item.id,
        uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads || null,
        channelTitle: item?.snippet?.title || 'UK Parliament',
      }
    }

    async function getLiveVideo(apiKey, channelId) {
      const endpoint =
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&channelId=${encodeURIComponent(channelId)}` +
        `&eventType=live&type=video&order=date&maxResults=1&key=${encodeURIComponent(apiKey)}`

      const data = await ytFetch(endpoint, apiKey)
      const item = data?.items?.[0]
      const videoId = item?.id?.videoId
      if (!videoId) return null

      return {
        videoId,
        title: item?.snippet?.title || 'Live stream',
        publishedAt: item?.snippet?.publishedAt || null,
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          null,
        isLive: true,
        source: 'live',
      }
    }

    async function getLatestUploadedVideo(apiKey, uploadsPlaylistId) {
      if (!uploadsPlaylistId) return null

      const endpoint =
        `https://www.googleapis.com/youtube/v3/playlistItems?` +
        `part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
        `&maxResults=1&key=${encodeURIComponent(apiKey)}`

      const data = await ytFetch(endpoint, apiKey)
      const item = data?.items?.[0]
      const videoId = item?.snippet?.resourceId?.videoId
      if (!videoId) return null

      return {
        videoId,
        title: item?.snippet?.title || 'Latest upload',
        publishedAt: item?.snippet?.publishedAt || null,
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          null,
        isLive: false,
        source: 'latest',
      }
    }

    async function loadNormalizedPolls() {
      const pollsData = await loadContentSection('pollsData')
      const raw = Array.isArray(pollsData) ? pollsData : []
      const normalized = raw
        .map((row, idx) => normalizePollRecord(row, idx))
        .filter(Boolean)

      return sortPollsNewestFirst(normalized)
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/parliament-video') {
        if (!env.YOUTUBE_API_KEY) {
          return jsonResponse(
            {
              error: 'Missing YOUTUBE_API_KEY',
              message: 'Set the YOUTUBE_API_KEY secret in Cloudflare Workers.',
            },
            { status: 500 }
          )
        }

        const { channelId, uploadsPlaylistId, channelTitle } = await getChannelIdFromHandle(
          env.YOUTUBE_API_KEY,
          '@UKParliament'
        )

        let video = await getLiveVideo(env.YOUTUBE_API_KEY, channelId)

        if (!video) {
          video = await getLatestUploadedVideo(env.YOUTUBE_API_KEY, uploadsPlaylistId)
        }

        if (!video) {
          return jsonResponse(
            {
              error: 'No video found',
              message: 'Could not find a live or latest UK Parliament video.',
              channelId,
              channelTitle,
            },
            { status: 404 }
          )
        }

        return jsonResponse({
          ...video,
          channelId,
          channelTitle,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          channelUrl: 'https://www.youtube.com/@UKParliament',
          commonsUrl: 'https://www.parliamentlive.tv/Commons',
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/polls/import') {
        const body = await request.json()
        const polls = Array.isArray(body?.polls) ? body.polls : null

        if (!polls) {
          return jsonResponse(
            { error: 'Missing polls array' },
            { status: 400 }
          )
        }

        const existingPolls = await loadContentSection('pollsData')
        const mergedPolls = mergePolls(existingPolls, polls)

        await saveContentSection('pollsData', mergedPolls)

        return jsonResponse({
          ok: true,
          imported: polls.length,
          totalPolls: mergedPolls.length,
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/polls/latest') {
        const polls = await loadNormalizedPolls()
        return jsonResponse({
          count: polls.length,
          polls,
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/pollsters') {
        const polls = await loadNormalizedPolls()
        const groups = new Map()

        for (const poll of polls) {
          if (!poll.pollster) continue

          if (!groups.has(poll.pollster)) {
            groups.set(poll.pollster, {
              name: poll.pollster,
              isBpcMember: !!poll.isBpcMember,
              pollCount: 0,
              latestPoll: null,
            })
          }

          const g = groups.get(poll.pollster)
          g.pollCount += 1

          if (
            !g.latestPoll ||
            (poll.publishedAt || poll.fieldworkEnd || poll.fieldworkStart || '') >
              (g.latestPoll.publishedAt ||
                g.latestPoll.fieldworkEnd ||
                g.latestPoll.fieldworkStart ||
                '')
          ) {
            g.latestPoll = poll
          }
        }

        return jsonResponse({
          count: groups.size,
          pollsters: [...groups.values()].sort(
            (a, b) => b.pollCount - a.pollCount || a.name.localeCompare(b.name)
          ),
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/data') {
        const polls = await env.DB.prepare(
          'SELECT id, name, pct, change, seats, updated_at FROM polls ORDER BY id ASC'
        ).all()

        const leaders = await env.DB.prepare(
          'SELECT id, name, net, role, bio, party FROM leaders ORDER BY id ASC'
        ).all()

        const elections = await env.DB.prepare(
          'SELECT id, name, date, data FROM elections ORDER BY id ASC'
        ).all()

        const metaObj = await loadMeta()

        const trends = await loadContentSection('trends')
        const betting = await loadContentSection('betting')
        const byElections = await loadContentSection('byElections')
        const migration = await loadContentSection('migration')
        const milestones = await loadContentSection('milestones')
        const pollsData = await loadContentSection('pollsData')
        const demographics = await loadContentSection('demographics')
        const newsItems = await loadContentSection('newsItems')

        return jsonResponse({
          polls: polls.results || [],
          leaders: leaders.results || [],
          elections: (elections.results || []).map((row) => ({
            ...row,
            data: row.data ? JSON.parse(row.data) : null,
          })),
          meta: metaObj,
          trends: trends || [],
          betting: betting || null,
          byElections: byElections || null,
          migration: migration || null,
          milestones: milestones || [],
          pollsData: pollsData || [],
          demographics: demographics || null,
          newsItems: newsItems || [],
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/save') {
        const body = await request.json()
        const { section, payload } = body || {}

        if (!section) {
          return new Response('Missing section', { status: 400, headers: corsHeaders })
        }

        if (section === 'meta') {
          const entries = Object.entries(payload || {})
          for (const [key, value] of entries) {
            await env.DB.prepare(
              'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)'
            )
              .bind(key, String(value ?? ''))
              .run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (section === 'polls') {
          await env.DB.prepare('DELETE FROM polls').run()

          for (const row of payload || []) {
            await env.DB.prepare(
              'INSERT INTO polls (id, name, pct, change, seats, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
            )
              .bind(
                row.id ?? null,
                row.name ?? '',
                row.pct ?? 0,
                row.change ?? 0,
                row.seats ?? 0,
                row.updated_at ?? new Date().toISOString()
              )
              .run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (section === 'leaders') {
          await env.DB.prepare('DELETE FROM leaders').run()

          for (const row of payload || []) {
            await env.DB.prepare(
              'INSERT INTO leaders (id, name, net, role, bio, party) VALUES (?, ?, ?, ?, ?, ?)'
            )
              .bind(
                row.id ?? null,
                row.name ?? '',
                row.net ?? 0,
                row.role ?? '',
                row.bio ?? '',
                row.party ?? ''
              )
              .run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (section === 'elections') {
          await env.DB.prepare('DELETE FROM elections').run()

          for (const row of payload || []) {
            await env.DB.prepare(
              'INSERT INTO elections (id, name, date, data) VALUES (?, ?, ?, ?)'
            )
              .bind(
                row.id ?? null,
                row.name ?? '',
                row.date ?? '',
                JSON.stringify(row.data ?? null)
              )
              .run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (
          [
            'trends',
            'betting',
            'byElections',
            'migration',
            'milestones',
            'pollsData',
            'demographics',
            'newsItems',
          ].includes(section)
        ) {
          await saveContentSection(section, payload)
          return new Response('ok', { headers: corsHeaders })
        }

        return new Response('Unknown section', { status: 400, headers: corsHeaders })
      }

      if (request.method === 'POST' && url.pathname === '/api/seed') {
        const body = await request.json()

        await env.DB.prepare('DELETE FROM polls').run()
        await env.DB.prepare('DELETE FROM leaders').run()
        await env.DB.prepare('DELETE FROM elections').run()
        await env.DB.prepare('DELETE FROM meta').run()

        if (await tableExists('content')) {
          await env.DB.prepare('DELETE FROM content').run()
        }

        for (const p of body.parties || []) {
          await env.DB.prepare(
            'INSERT INTO polls (id, name, pct, change, seats, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
          )
            .bind(
              p.id ?? null,
              p.name ?? '',
              p.pct ?? 0,
              p.change ?? 0,
              p.seats ?? 0,
              new Date().toISOString()
            )
            .run()
        }

        for (const leader of body.leaders || []) {
          await env.DB.prepare(
            'INSERT INTO leaders (id, name, net, role, bio, party) VALUES (?, ?, ?, ?, ?, ?)'
          )
            .bind(
              leader.id ?? null,
              leader.name ?? '',
              leader.net ?? 0,
              leader.role ?? '',
              leader.bio ?? '',
              leader.party ?? ''
            )
            .run()
        }

        await env.DB.prepare(
          'INSERT INTO elections (id, name, date, data) VALUES (?, ?, ?, ?)'
        )
          .bind(1, 'main', '', JSON.stringify(body.elections ?? {}))
          .run()

        for (const [key, value] of Object.entries(body.meta || {})) {
          await env.DB.prepare('INSERT INTO meta (key, value) VALUES (?, ?)')
            .bind(key, String(value ?? ''))
            .run()
        }

        if (await tableExists('content')) {
          const contentSections = {
            trends: body.trends || [],
            betting: body.betting || null,
            byElections: body.byElections || null,
            migration: body.migration || null,
            milestones: body.milestones || [],
            pollsData: body.polls || [],
            demographics: body.demographics || null,
            newsItems: body.newsItems || [],
          }

          for (const [section, data] of Object.entries(contentSections)) {
            await env.DB.prepare(
              `INSERT INTO content (section, data, updated_at)
               VALUES (?, ?, ?)
               ON CONFLICT(section) DO UPDATE SET
                 data = excluded.data,
                 updated_at = excluded.updated_at`
            )
              .bind(section, JSON.stringify(data), new Date().toISOString())
              .run()
          }
        }

        return new Response('seeded', { headers: corsHeaders })
      }

      return new Response('Not found', { status: 404, headers: corsHeaders })
    } catch (err) {
      return jsonResponse(
        {
          error: 'Worker failed',
          message: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      )
    }
  },
}
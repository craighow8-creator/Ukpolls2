import fetchYouGovPoll from './sources/yougov.mjs'
import fetchMoreInCommonPoll from './sources/moreincommon.mjs'
import fetchTechnePoll from './sources/techne.mjs'
import fetchOpiniumPoll from './sources/opinium.mjs'
import fetchIpsosPoll from './sources/ipsos.mjs'

const API_BASE = 'https://politiscope-api.craighow8.workers.dev'

async function importPolls(polls) {
  const res = await fetch(`${API_BASE}/api/polls/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ polls }),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Import failed ${res.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }
}

async function main() {
  const polls = []

  console.log('Fetching YouGov...')
  polls.push(await fetchYouGovPoll())

  console.log('Fetching More in Common...')
  polls.push(await fetchMoreInCommonPoll())

  console.log('Fetching Techne...')
  polls.push(await fetchTechnePoll())

  console.log('Fetching Opinium...')
  polls.push(await fetchOpiniumPoll())

  console.log('Fetching Ipsos...')
  polls.push(await fetchIpsosPoll())

  console.log('Fetched polls:')
  console.log(JSON.stringify(polls, null, 2))

  console.log('Importing to Worker...')
  const result = await importPolls(polls)

  console.log('Import result:')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Ingest failed:')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

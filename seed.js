global.window = {}

async function run() {
  const mod = await import('./src/data/data.js')
  const DEFAULTS = mod.default || global.window.POLITISCOPE_DATA

  const res = await fetch('https://politiscope-api.craighow8.workers.dev/api/seed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(DEFAULTS)
  })

  const text = await res.text()
  console.log('Response:', res.status, text)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
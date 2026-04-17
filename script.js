async function joinServerDirect(){
  for (let i = 2; i < 20; i++) {
    const payload = {
      user_id:"usr_00"+i,
      server_id:"03ff2547-da15-4e07-ad0a-5f8f4dceff0d"
    }

    let attempts = 0
    const maxRetries = 3

    while (attempts < maxRetries) {
      try {
        const res = await fetch("http://localhost:8080/server/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        })


         if (!res.ok) {
    const body = await res.text()
    console.error(`Failed for ${payload.user_id}:`, body)  // add this
    throw new Error(`HTTP ${res.status}`)
  }


        break

      } catch (err) {
        attempts++

        if (attempts >= maxRetries) {
          throw new Error(`Failed for user ${payload.user_id} after ${maxRetries} attempts`)
        }
        await new Promise(r => setTimeout(r, 500 * attempts))
      }
    }
  }
}

(async ()=>{
  await joinServerDirect()
})()

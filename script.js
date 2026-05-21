
async function joinServerDirect() {
  for (let i = 8; i < 100; i++) {
    const payload = {
      id: "usr_00" + i,
      username: "usrname_00" + i
    }

    let attempts = 0
    const maxRetries = 3

    while (attempts < maxRetries) {
      try {
        const res = await fetch("http://localhost:8080/users/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        })


        if (!res.ok) {
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

(async () => {
  await joinServerDirect()
})()

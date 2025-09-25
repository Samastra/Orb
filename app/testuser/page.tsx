import { currentUser } from "@clerk/nextjs/server"

export default async function TestPage() {
  const user = await currentUser()
  
  console.log('FULL USER OBJECT:', user)
  console.log('User ID:', user?.id)
  console.log('Email:', user?.emailAddresses[0]?.emailAddress)
  console.log('Full Name:', user?.fullName)
  console.log('Username:', user?.username)


  return (
    <div>
      <h1>User Data Test</h1>
      <p>ID: {user?.id}</p>
      <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
      <p>Name: {user?.fullName}</p>
    </div>
  )
}
import Link from "next/link"
import { Button } from "./ui/button"
import { SignOutButton } from "@clerk/nextjs"

const Navbar = () => {
  return (
    <nav className = " flex items-center justify-between p-4 bg-white shadow-[0_0_30px_rgba(0,0,0,0.15)] m-6 rounded-lg">
      <div className="flex items-center justify-between ">
        <Link href= "/">
        <h1 className="text-2xl font-bold mr-10 ml-10">Orb</h1>
        </Link>
            <div className="flex gap-4">
              <Link href={"/features"}>Features</Link>
              <Link href={"/help"}>Help</Link>
              <Link href={"/contact"}>Contact</Link>
            </div>
      </div>

      <div className="flex gap-4 justify-center items-center mr-10">
        <Link href={"/boards"}>Boards</Link>
        <Link href={"/sign-in"}><Button>Sign In</Button></Link>
        <Link href={"/sign-up"}><Button>Sign Up</Button></Link>
        <SignOutButton />

      </div>
        </nav>
  )
}

export default Navbar
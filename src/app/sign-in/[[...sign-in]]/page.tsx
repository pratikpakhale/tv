import { SignIn } from '@clerk/nextjs'
import { AuthFrame } from '@/components/AuthFrame'

export default function SignInPage() {
  return (
    <AuthFrame>
      <SignIn />
    </AuthFrame>
  )
}

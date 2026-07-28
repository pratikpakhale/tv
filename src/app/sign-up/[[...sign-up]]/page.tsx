import { SignUp } from '@clerk/nextjs'
import { AuthFrame } from '@/components/AuthFrame'

export default function SignUpPage() {
  return (
    <AuthFrame>
      <SignUp />
    </AuthFrame>
  )
}

import React from 'react'
import { useUser } from '@clerk/react'

const useAuth = () => {
     const { isSignedIn, user, isLoaded } = useUser();
     console.log(">>>isSignedIn", isSignedIn);
     console.log(">>>isLoaded", isLoaded);
     console.log(">>>user",user);
  return (
     { isSignedIn, user, isLoaded } 
  )
}

export default useAuth

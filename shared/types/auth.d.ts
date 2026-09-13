declare module '#auth-utils' {
  interface UserSession {
    partyId?: number
    admin?: boolean
  }

  /** server-only, sealed in the cookie — never written to the database */
  interface SecureSessionData {
    /** one-off OAuth state proving the Monzo callback answers this admin's own request */
    monzoState?: string
    /** held only between the Monzo callback and the check it authorises */
    monzoToken?: string
  }
}

export {}

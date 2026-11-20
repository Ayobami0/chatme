import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * The session generation this request belongs to. Captured automatically at send
     * time, or pinned by the caller (see `TokenManager.captureSession`) so a request
     * from an ended session is refused before it is sent.
     */
    sessionGeneration?: number;
    /**
     * Send with this access token instead of the current session's, bypassing session
     * checks and refresh. Used for bounded cleanup of a session that already ended.
     */
    authOverride?: string;
  }
}

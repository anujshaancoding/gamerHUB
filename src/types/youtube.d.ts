/* YouTube IFrame Player API type declarations */

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: PlayerState;
    target: Player;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    fs?: 0 | 1;
    loop?: 0 | 1;
    modestbranding?: 0 | 1;
    playlist?: string;
    rel?: 0 | 1;
    playsinline?: 0 | 1;
    start?: number;
    end?: number;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    playerVars?: PlayerVars;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: { data: number; target: Player }) => void;
    };
  }

  interface VideoData {
    title: string;
    video_id: string;
    author: string;
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    getDuration(): number;
    getCurrentTime(): number;
    getVideoData(): VideoData;
    getPlayerState(): PlayerState;
    destroy(): void;
  }
}

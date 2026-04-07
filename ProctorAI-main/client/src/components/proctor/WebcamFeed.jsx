export default function WebcamFeed({ videoRef, showLive = false, statusLabel = "" }) {
  return (
    <div className="webcam-wrapper">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {showLive && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 rounded-lg px-2.5 py-1 backdrop-blur-sm">
          <span className="live-dot" />
          <span className="text-white text-xs font-semibold tracking-wide">LIVE</span>
        </div>
      )}
      {statusLabel && (
        <div className="absolute bottom-2.5 right-2.5 bg-black/60 rounded-lg px-2 py-0.5 backdrop-blur-sm">
          <span className="text-white/70 text-xs">{statusLabel}</span>
        </div>
      )}
    </div>
  );
}

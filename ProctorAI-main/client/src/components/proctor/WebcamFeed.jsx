export default function WebcamFeed({ videoRef }) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="aspect-video w-full rounded-2xl border border-black/10 bg-black object-cover"
    />
  );
}

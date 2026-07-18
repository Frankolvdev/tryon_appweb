import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TryOn inicio">
      <span className="brandMark">T</span>
      <span>TRYON<span className="brandAccent">AI</span></span>
    </Link>
  );
}

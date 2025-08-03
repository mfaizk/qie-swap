import CopyButton from "@/common-component/CopyButton";

export function maskValue({ str, enableCopyButton = false }) {
  if (!str) return "";

  const len = str.length;
  const keep = Math.floor(len * 0.3);
  const start = Math.ceil(keep / 3);
  const end = Math.floor(keep / 3);

  return (
    <span className="flex gap-2">
      {str.slice(0, start)}...{str.slice(-end)}
      {enableCopyButton && (
        <span>
          <CopyButton text={str} />
        </span>
      )}
    </span>
  );
}

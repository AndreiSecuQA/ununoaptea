import { Icon, type IconId } from "@/lib/iconRegistry";

interface Props {
  id: IconId;
  size?: number;
  className?: string;
}

export default function IconRenderer({ id, size = 28, className }: Props) {
  return (
    <Icon
      id={id}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  );
}

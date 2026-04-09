export default function UserBadge({ user, size = 'sm' }) {
  const sizes = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ backgroundColor: user.color }}
      title={user.name}
    >
      {user.name.charAt(0)}
    </div>
  )
}

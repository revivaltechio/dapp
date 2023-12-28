export default function Card ({ children, title }) {
  return (
    <div className="rounded-sm p-5 relative mb-4">
      <div className="uppercase font-bold mb-4">
        {title}
      </div>
      {children}
    </div>
  )
}
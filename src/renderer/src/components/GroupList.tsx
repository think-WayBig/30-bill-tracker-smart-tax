// GroupList.tsx
import { FixedSizeList, FixedSizeListProps } from 'react-window'

// Simple wrapper so you can keep <GroupList> in your JSX
export const GroupList = (props: FixedSizeListProps) => <FixedSizeList {...props} />

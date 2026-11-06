'use client'

import { SkeletonProductGrid } from '@/components/ui/GlobalLoading'

export default function Loading() {
  return (
    <div className="container-custom py-8">
      <SkeletonProductGrid count={6} variant="default" />
    </div>
  )
}
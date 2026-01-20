import { getMembershipTiers, getMembers } from "@/app/actions/members"
import { MembersClient } from "./members-client"

export const dynamic = "force-dynamic"

export default async function MembersPage() {
  const [tiersResult, membersResult] = await Promise.all([
    getMembershipTiers(),
    getMembers(),
  ])

  return (
    <MembersClient
      initialTiers={tiersResult.tiers || []}
      initialMembers={membersResult.members || []}
    />
  )
}

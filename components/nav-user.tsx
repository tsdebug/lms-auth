"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  EllipsisVerticalIcon, UserIcon, LogOutIcon,
  PlusIcon, XIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string }
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useAuthActions()

  // fetch full user data for the settings form
  const currentUser = useQuery(api.users.queries.getCurrentUser)
  const updateProfile = useMutation(api.users.mutations.updateUserProfile)

  // controls whether the settings sheet is open
  const [settingsOpen, setSettingsOpen] = useState(false)

  // form state
  const [fName, setFName] = useState("")
  const [lName, setLName] = useState("")
  const [bio, setBio] = useState("")
  const [expertise, setExpertise] = useState<string[]>([])
  const [newExpertise, setNewExpertise] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const isTeacher = currentUser?.roles?.some((r) => r?.name === "teacher")

  // pre-fill form when sheet opens and user data is available
  // WHY useEffect: we only want to reset form when sheet opens,
  // not on every re-render
  useEffect(() => {
    if (settingsOpen && currentUser && !initialized) {
      setFName(currentUser.fName ?? "")
      setLName(currentUser.lName ?? "")
      setBio(currentUser.bio ?? "")
      setExpertise(currentUser.expertise ?? [])
      setExperienceLevel(currentUser.experienceLevel ?? "")
      setInitialized(true)
    }
    // reset initialized when sheet closes so it re-fills next time
    if (!settingsOpen) setInitialized(false)
  }, [settingsOpen, currentUser, initialized])

  function addExpertise() {
    const trimmed = newExpertise.trim()
    if (!trimmed || expertise.includes(trimmed)) return
    setExpertise((prev) => [...prev, trimmed])
    setNewExpertise("")
  }

  function removeExpertise(tag: string) {
    setExpertise((prev) => prev.filter((e) => e !== tag))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        fName: fName.trim() || undefined,
        lName: lName.trim() || undefined,
        bio: bio.trim() || undefined,
        expertise: expertise.length > 0 ? expertise : undefined,
        experienceLevel: (experienceLevel as any) || undefined,
      } as any)
      toast.success("Profile updated")
      setSettingsOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  // initials for avatar fallback
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <EllipsisVerticalIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              {/* user info header */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {/* profile — opens settings sheet */}
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                  <UserIcon className="size-4" />
                  Profile & Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut()}
              >
                <LogOutIcon className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle>Profile & Settings</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 pt-4">

            {/* email — read only */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                value={user.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>

            {/* name */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-xs">First name</Label>
                <Input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-xs">Last name</Label>
                <Input
                  value={lName}
                  onChange={(e) => setLName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* bio */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            {/* teacher-only fields */}
            {isTeacher && (
              <div className="border-t pt-4 flex flex-col gap-4">
                <p className="text-sm font-medium">Teaching profile</p>

                {/* expertise tags */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Expertise</Label>
                  {expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {expertise.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => removeExpertise(tag)}
                            className="hover:text-destructive"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="e.g. Python, Design"
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && addExpertise()}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addExpertise}
                      disabled={!newExpertise.trim()}
                    >
                      <PlusIcon className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter or + to add a tag.
                  </p>
                </div>

                {/* experience level */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Experience level</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            )}

            {/* save — always at the bottom */}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
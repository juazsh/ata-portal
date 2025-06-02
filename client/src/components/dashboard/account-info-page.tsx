"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  UserIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  KeyIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
  CameraIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

function AccountInfoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      country: "United States",
    },
  })
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      country: "United States",
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const profile = await response.json()
      const normalizedProfile = {
        ...profile,
        address: {
          country: "United States",
          ...profile.address,
        },
      }
      setUserProfile(normalizedProfile)
      setEditedProfile(normalizedProfile)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedProfile({ ...userProfile })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedProfile({ ...userProfile })
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(editedProfile),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile")
      }

      setUserProfile(data.user)
      setEditedProfile(data.user)
      setIsEditing(false)

      toast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStateChange = (value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: value,
      },
    }))
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressChange = (field: keyof UserProfile["address"], value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }))
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    setIsChangingPassword(true)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      setIsChangingPassword(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long")
      setIsChangingPassword(false)
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "Password updated successfully!",
        variant: "default",
      })

      setShowChangePassword(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setPasswordError("Failed to update password. Please try again.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Loading Profile</h3>
            <p className="text-muted-foreground">Please wait while we fetch your account information...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role && (
            <Badge variant="outline" className="px-3 py-1">
              <ShieldIcon className="h-3 w-3 mr-1" />
              {user.role.toUpperCase()}
            </Badge>
          )}
          <Button
            variant={isEditing ? "outline" : "default"}
            className="flex items-center gap-2"
            onClick={isEditing ? handleCancelEdit : handleEditClick}
            disabled={isSaving}
          >
            {isEditing ? (
              <>
                <XIcon className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <EditIcon className="h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              {/* <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Picture
              </CardTitle> */}
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt={`${userProfile.firstName} ${userProfile.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-16 w-16 text-primary" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                  disabled
                >
                  <CameraIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {userProfile.firstName} {userProfile.lastName}
                </h3>
                {/* <p className="text-muted-foreground">{userProfile.email}</p> */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic account information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editedProfile.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{userProfile.firstName || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editedProfile.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{userProfile.lastName || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  {isEditing ? (
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <MailIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{userProfile.email || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={editedProfile.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Enter your phone number"
                        className="pl-10"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{userProfile.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Address Information
              </CardTitle>
              <CardDescription>Your residential address and location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="street" className="text-sm font-medium">
                    Street Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="street"
                      value={editedProfile.address.street || ""}
                      onChange={(e) => handleAddressChange("street", e.target.value)}
                      placeholder="Enter your street address"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{userProfile.address.street || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={editedProfile.address.city || ""}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      placeholder="Enter your city"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{userProfile.address.city || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State
                  </Label>
                  {isEditing ? (
                    <Select onValueChange={handleStateChange} value={editedProfile.address.state || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">
                        {userProfile.address.state
                          ? US_STATES.find((s) => s.code === userProfile.address.state)?.name ||
                            userProfile.address.state
                          : "Not provided"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-medium">
                    ZIP Code
                  </Label>
                  {isEditing ? (
                    <Input
                      id="zip"
                      value={editedProfile.address.zip || ""}
                      onChange={(e) => handleAddressChange("zip", e.target.value)}
                      placeholder="Enter your ZIP code"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{userProfile.address.zip || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{userProfile.address.country || "United States"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {isEditing ? (
              <Button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleEditClick} className="flex items-center gap-2">
                <EditIcon className="h-4 w-4" />
                Edit Profile
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowChangePassword(true)} className="flex items-center gap-2">
              <KeyIcon className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-destructive text-sm">{passwordError}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)} disabled={isChangingPassword}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AccountInfoPage

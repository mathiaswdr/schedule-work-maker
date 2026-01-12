'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

import { Session } from "next-auth"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"

import { Input } from "@/components/ui/input"

import { SettingsSchema } from "@/types/settings-schema"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { FormError } from "@/components/auth/form-error"
import { FormSuccess } from "@/components/auth/form-success"
import {useAction} from "next-safe-action/hooks"
import { settings } from "@/server/actions/settings"
import { useState } from "react"
import { UploadButton } from "@/app/api/uploadthing/upload"


type SettingsForm = {
    session: Session
}
  

export default function SettingsCard(session : SettingsForm){

    const [error, setError] = useState<string | undefined>(undefined)
    const [success, setSuccess] = useState<string | undefined>(undefined)
    const [imageUploading, setImageUploading] = useState<boolean>(false)

    const form = useForm<z.infer<typeof SettingsSchema>>({
        defaultValues: {
            password: undefined,
            newPassword: undefined,
            name: session.session.user?.name || undefined,
            email: session.session.user?.email || undefined,
            image: session.session.user?.image || undefined
            // isTwoFactorEnabled: session.session.user?.isTwoFactorEnabled || false,

        }
    })

    const {execute, status} = useAction(settings, {
        onSuccess: (data) => {
           if(data) setSuccess("Settings updated")
            if(!data) setError("Something went wrong")
        },

        onError: () => {
            setError("Something went wrong")
        },
    
    })

    const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
        execute(values)
    }
 
    return(
        <Card className="w-full maxW mb:w-11/12">
            <CardHeader>
                <CardTitle>Your Settings</CardTitle>
                <CardDescription>Update your account settings</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input disabled={status==="executing"} placeholder="user name" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is your public display name.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Avatar</FormLabel>
                            <div className="flex items-center gap-4">
                                {!form.getValues("image") && (
                                    <div className="font-bold">
                                        {session.session.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {form.getValues("image") && (
                                    <Image 
                                        className="rounded-full w-12 h-12 object-cover" 
                                        src={form.getValues("image")!}
                                        alt="user avatar"
                                        width={42}
                                        height={42}
                                        quality={100}
                                    />
                                )}
                                <UploadButton 
                                    className="sclae-75 ut-button:ring-primary ut-button:bg-primary/75 hover:ut-button:bg-primary/100 ut-button:transition-all ut-button:duration-500 ut-label:hidden ut-allowed-content:hidden"
                                    endpoint="imageUploader"
                                    onUploadBegin={() => setImageUploading(true)}
                                    onUploadError={(error) => {
                                        form.setError('image', {
                                            type: "validate",
                                            message: error.message
                                        })
                                    }} 
                                    onClientUploadComplete={(res) => {
                                        form.setValue('image', res[0].url!)
                                        setImageUploading(false)
                                    }}
                                    content={{button({ready}){
                                    if(ready) return <div>Change Avatar</div>
                                    return <div>Uploading...</div>
                                }}}/>

                            </div>
                            <FormControl>
                                <Input type="hidden" disabled={status==="executing"} placeholder="user image" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {/* <FormField
                        control={form.control}
                        name="isTwoFactorEnabled"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Two Factor Authentication</FormLabel>
                            <FormControl>
                                <Switch disabled={status==="executing" || session.session.user.isOAuth === true}/>
                            </FormControl>
                            <FormDescription>
                                Enable two factor authentication for your account
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        /> */}
                        <FormError message={error} />
                        <FormSuccess message={success}/>
                        <Button type="submit" className="bg-primary" disabled={status==="executing" || imageUploading === true }>Update your settings</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

    )
}
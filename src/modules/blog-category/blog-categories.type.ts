export type TCreateBlogCategory = {
 name:string
 slug:string
 isActive?:boolean
}

export type TUpdateBlogCategory = {
 name?:string
 slug?:string
 isActive?:boolean
}
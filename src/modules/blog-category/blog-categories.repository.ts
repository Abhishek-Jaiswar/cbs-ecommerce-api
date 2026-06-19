import { prisma } from "../../lib/prisma.js";
import type { TCreateBlogCategory, TUpdateBlogCategory } from "./blog-categories.type.js";


class BlogCategoryRepository{


    async getCategories(page : number, limit : number){
        const[items, total] = await prisma.$transaction([
            prisma.blogCategory.findMany({

                skip: (page - 1) * limit,
                take : limit,

                orderBy : {

                    name : "asc",
                },

                include : {
                    _count : {
                        select :{
                            posts : true,
                        }
                    }
                }
                
            }),
            prisma.blogCategory.count(),
        ]);

        return {

            items,
            total,
            page,
            limit,
            totalPages : Math.ceil(total / limit),
        };
    }

    async getCategoryById(id : string){
        return prisma.blogCategory.findUnique({
            where : {
                id,
            },
        });

    }

    async getCategoryBySlug(slug : string){
        return prisma.blogCategory.findUnique({
            where :{
                slug,
            }
        })

    }

    async createCategory(payload : TCreateBlogCategory){
        return prisma.blogCategory.create({
            data : payload,
        })
    }

    async updateCategory(id : string, payload : TUpdateBlogCategory){

        const data = Object.fromEntries(
            Object.entries(payload).filter(
                ([_, value]) => value !== undefined
            )
        );
        return prisma.blogCategory.update({
             where : {
                id,
             },

             data,
            
        })

    }

    async deleteCategory(id : string){

        return prisma.blogCategory.delete({

            where : {
                id,
            },

        });

    }
}

export const blogCategoryRepository = new BlogCategoryRepository(); 
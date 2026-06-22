import { prisma } from "../../lib/prisma.js";
import type { LandingPageCreateInput, LandingPageUpdateInput } from "./landing.type.js";


class LandingPageRepositoryClass{
    publish(id: string) {
        throw new Error("Method not implemented.");
    }
    remove(id: string) {
        throw new Error("Method not implemented.");
    }

    async create(
        data : LandingPageCreateInput
    ){
        return prisma.landingPage.create({
            data
        })
    }

    async findAll(){
        return prisma.landingPage.findMany({

            orderBy : {
                createdAt : "desc"
            },
        });
    }

    async findById(id : string){
        
        return prisma.landingPage.findUnique({
            where: {
                id,
            }
        });
    }

    async findByslug(slug : string){
        return prisma.landingPage.findUnique({
            where : {
                slug,
            }
        })

    }

    async update(id: string,
        data: LandingPageUpdateInput
    ){

        return prisma.landingPage.update({
            where : {
                id,
            },
            data
        })

    }

    async delete(id : string){
        return prisma.landingPage.delete({
            where : {
                id,
            }
        })
    }
}

export const LandingPageRepository = new LandingPageRepositoryClass();
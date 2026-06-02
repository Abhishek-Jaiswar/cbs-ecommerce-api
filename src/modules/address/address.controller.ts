import type { Request, Response, NextFunction } from "express";
import { createAddressBodySchema, updateAddressBodySchema } from "./address.schema.js";
import { addressService } from "./address.service.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors/app-error.js";
import type { TCreateAddress, TUpdateAddress } from "./address.types.js";

class AddressController {
  async getMyAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const result = await addressService.getAddressesByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "Addresses fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAddressById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!id) {
        throw new BadRequestError("Address ID is required");
      }

      if (!userId || !userRole) {
        throw new UnauthorizedError("Authentication required");
      }

      const address = await addressService.getAddressById(id, userId, userRole);

      return res.status(200).json({
        success: true,
        message: "Address details fetched successfully",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const validation = createAddressBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const createPayload: TCreateAddress = {
        fullname: validation.data.fullname,
        phoneNumber: validation.data.phoneNumber,
        addressLine1: validation.data.addressLine1,
        addressLine2: validation.data.addressLine2 ?? null,
        landmark: validation.data.landmark ?? null,
        city: validation.data.city,
        state: validation.data.state,
        postalCode: validation.data.postalCode,
        country: validation.data.country,
        isDefaultShipping: validation.data.isDefaultShipping,
        isDefaultBilling: validation.data.isDefaultBilling,
        userId,
      };

      const address = await addressService.createAddress(createPayload);

      return res.status(201).json({
        success: true,
        message: "Address created successfully",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!id) {
        throw new BadRequestError("Address ID is required");
      }

      if (!userId || !userRole) {
        throw new UnauthorizedError("Authentication required");
      }

      const validation = updateAddressBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatePayload: TUpdateAddress = {};
      const data = validation.data;
      if (data.fullname !== undefined) updatePayload.fullname = data.fullname;
      if (data.phoneNumber !== undefined) updatePayload.phoneNumber = data.phoneNumber;
      if (data.addressLine1 !== undefined) updatePayload.addressLine1 = data.addressLine1;
      if (data.addressLine2 !== undefined) updatePayload.addressLine2 = data.addressLine2;
      if (data.landmark !== undefined) updatePayload.landmark = data.landmark;
      if (data.city !== undefined) updatePayload.city = data.city;
      if (data.state !== undefined) updatePayload.state = data.state;
      if (data.postalCode !== undefined) updatePayload.postalCode = data.postalCode;
      if (data.country !== undefined) updatePayload.country = data.country;
      if (data.isDefaultShipping !== undefined)
        updatePayload.isDefaultShipping = data.isDefaultShipping;
      if (data.isDefaultBilling !== undefined)
        updatePayload.isDefaultBilling = data.isDefaultBilling;

      const address = await addressService.updateAddress(id, userId, userRole, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!id) {
        throw new BadRequestError("Address ID is required");
      }

      if (!userId || !userRole) {
        throw new UnauthorizedError("Authentication required");
      }

      await addressService.deleteAddress(id, userId, userRole);

      return res.status(200).json({
        success: true,
        message: "Address deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const addressController = new AddressController();

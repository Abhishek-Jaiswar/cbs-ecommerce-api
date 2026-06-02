import { addressRepository } from "./address.repository.js";
import { addressCache } from "./address.cache.js";
import type { TCreateAddress, TUpdateAddress } from "./address.types.js";
import { ForbiddenError, NotFoundError } from "../../utils/errors/app-error.js";

class AddressService {
  async getAddressesByUserId(userId: string) {
    return addressCache.getOrSetUserAddresses(userId, () =>
      addressRepository.getAddressesByUserId(userId)
    );
  }

  async getAddressById(id: string, userId: string, userRole: string) {
    const address = await addressCache.getOrSetAddressDetails(id, () =>
      addressRepository.getAddressById(id)
    );

    if (!address) {
      throw new NotFoundError("Address not found.");
    }

    if (address.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Access Denied: You do not own this address.");
    }

    return address;
  }

  async createAddress(payload: TCreateAddress) {
    const address = await addressRepository.createAddress(payload);
    await addressCache.invalidateUserAddresses(payload.userId);
    return address;
  }

  async updateAddress(id: string, userId: string, userRole: string, payload: TUpdateAddress) {
    const address = await addressRepository.getAddressById(id);

    if (!address) {
      throw new NotFoundError("Address not found.");
    }

    if (address.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Access Denied: You do not own this address.");
    }

    const updated = await addressRepository.updateAddress(id, address.userId, payload);
    await addressCache.invalidateAddress(id, address.userId);
    return updated;
  }

  async deleteAddress(id: string, userId: string, userRole: string) {
    const address = await addressRepository.getAddressById(id);

    if (!address) {
      throw new NotFoundError("Address not found.");
    }

    if (address.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Access Denied: You do not own this address.");
    }

    await addressRepository.deleteAddress(id);
    await addressCache.invalidateAddress(id, address.userId);
    return { id, success: true };
  }
}

export const addressService = new AddressService();

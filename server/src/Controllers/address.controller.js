import { Address } from "../Modals/address.modal.js";

// Add Address (post)
export const addAddress = async (req, res) => {
  try {
    const {
      clerkId,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      country,
      state,
      district,
      city,
      pincode,
      landmark,
      addressType,
    } = req.body;
    const addedAddress = await Address.create({
      clerkId: clerkId,
      fullName: fullName,
      phone: phone,
      addressLine1: addressLine1,
      addressLine2: addressLine2,
      country: country,
      state: state,
      district: district,
      city: city,
      pincode: pincode,
      landmark: landmark,
      addressType: addressType,
    });
    return res.status(201).json({
      success: true,
      message: "Created address successfully",
      data: addedAddress,
    });
  } catch (err) {
    console.error(err);
  }
};
// Get Address (get)
export const getAddress = async (req, res) => {
  try {
    const getAllAddress = await Address.find({});
    return res.status(200).json({
      success: true,
      message: "Fetched all the address successfully",
      data: getAllAddress,
    });
  } catch (err) {
    console.error(err);
  }
};
// Update Address (patch)
export const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    return res.status(200).json({
      success: true,
      message: "Updated address successfully",
      data: updatedAddress,
    });
  } catch (err) {
    console.error(err);
  }
};

// Delete Address (delete)
export const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const deletedAddress = await Address.findOneAndDelete({ _id: addressId });
    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: deletedAddress,
    });
  } catch (err) {
    console.error(err);
  }
};

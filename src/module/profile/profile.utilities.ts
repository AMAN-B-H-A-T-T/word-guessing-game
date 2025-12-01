import { Prisma, Users } from "@prisma/client";
import BadRequestException from "../../exceptions/badRequestException";
import CommonUtilities from "../../utilities/commonUtilities";
import profileServices from "./profile.services";
import { ICreateProfileReqBody } from "./profile.types";
import NotFoundRequestException from "../../exceptions/notFoundException";

class ProfileUtilities {
  static async createProfile(body: ICreateProfileReqBody) {
    const {
      avatar_url: avatarUrl,
      display_name: displayName,
      email,
      password,
    } = body;
    const currentTime = Date.now();
    const hashPassword = await CommonUtilities.generateEncryptedPassword(
      password
    );

    const userPayload = {
      id: CommonUtilities.generateRandomID("usr"),
      displayName,
      userEmail: email,
      password: hashPassword,
      avatarUrl,
      created: currentTime,
      modified: currentTime,
    };
    try {
      const result = await profileServices.prepareProfile(userPayload);
      return this.buildUserProfileResponse(result);
    } catch (error) {
      if (error?.code === "P2002") {
        throw new BadRequestException(
          "Invaild Profile details.Profile is already exist with given email and display_name."
        );
      }
      throw new Error(error);
    }
  }

  static async login(payload: Record<string, any>) {
    const { email, password } = payload;

    // check profile exist with given email
    const whereObject: Prisma.UsersWhereInput = {
      userEmail: email,
    };

    const createdProfile = await profileServices.fetchProfile({ whereObject });

    if (!createdProfile) {
      throw new BadRequestException("Invaild email. Profile not found");
    }

    const isSamePassowrd = await CommonUtilities.decryptAndComparePassword(
      createdProfile.password,
      password
    );

    if (!isSamePassowrd) {
      throw new BadRequestException("Invaild Passwod. Password is not match.");
    }

    const tokenPaylaod = {
      id: createdProfile.id,
      email: createdProfile.userEmail,
      displayName: createdProfile.displayName,
      avatarUrl: createdProfile.avatarUrl,
    };

    const token = CommonUtilities.generateAuthToken(tokenPaylaod);

    return { access: token, accountId: createdProfile.id };
  }

  static async fetchPlayerProfile(id: string) {
    if (!id) {
      throw new BadRequestException("Invaild request. player_id is missing.");
    }

    const whereObject: Prisma.UsersWhereInput = {
      id,
    };

    const profile = await profileServices.fetchProfile({
      whereObject,
    });

    if (!profile) {
      throw new NotFoundRequestException(
        `Invalid player_id. A profile details for id:${id} is not found.`
      );
    }

    return this.buildUserProfileResponse(profile);
  }

  static buildUserProfileResponse(profile: Record<string, any>) {
    return {
      display_name: profile.displayName,
      user_email: profile.userEmail,
      avatar_url: profile.avatarUrl,
      created: Number(profile.created),
      modified: Number(profile.modified),
    };
  }
}
export default ProfileUtilities;

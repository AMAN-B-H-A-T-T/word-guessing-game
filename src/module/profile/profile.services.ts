import { Prisma, PrismaPromise, Users } from "@prisma/client";
import database from "../../database";

class ProfileService {
  prepareProfile(data: any) {
    const { users: userModel } = database["prismaDrawPandasDB"];

    const query: Prisma.UsersCreateArgs = {
      data,
      select: {
        id: true,
        displayName: true,
        userEmail: true,
        avatarUrl: true,
        created: true,
        modified: true,
      },
    };
    return userModel.create(query);
  }

  fetchProfile({ whereObject, selectObject }: any): PrismaPromise<Users> {
    const { users: userModel } = database["prismaDrawPandasDB"];

    const query: Prisma.UsersFindFirstArgs = {};

    if (whereObject) {
      query.where = whereObject;
    }

    if (selectObject) {
      query.select = selectObject;
    }

    return userModel.findFirst(query);
  }
}
export default new ProfileService();

import type { Migration } from ".";
import { collections } from "@lib/server/database";
import { ObjectId } from "mongodb";

const resetTools: Migration = {
	_id: new ObjectId("5f9f5f5f5f5f5f5f5f5f5f4f"),
	name: "Reset tools to empty",
	up: async () => {
		const { settings } = collections;

		await settings.updateMany({}, { $set: { tools: [] } });

		return true;
	},
	runEveryTime: false,
};

export default resetTools;

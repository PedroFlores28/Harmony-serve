import db from "../../../components/db"
import lib from "../../../components/lib"

const { Banner, Session } = db
const { error, success, midd } = lib

const RANK_IMAGES_ID = "rank_images"

export default async (req, res) => {
    await midd(req, res)

    let { session } = req.query

    session = await Session.findOne({ value: session })
    if (!session) return res.json(error("invalid session"))

    if (req.method === "GET") {
        let rankImages = await Banner.findOne({ id: RANK_IMAGES_ID })

        if (!rankImages) {
            rankImages = {}
        }

        return res.json(success({ rankImages }))
    }
}

import db from "../../../components/db"
import lib from "../../../components/lib"

const { Banner } = db
const { error, success, midd } = lib

const RANK_IMAGES_ID = "rank_images"
const VALID_RANKS = [
    "bronce",
    "plata",
    "oro",
    "zafiro",
    "rubi",
    "esmeralda",
    "diamante",
    "doble_diamante",
    "triple_diamante",
    "diamante_corona"
]

export default async (req, res) => {
    await midd(req, res)

    if (req.method === "GET") {
        let rankImages = await Banner.findOne({ id: RANK_IMAGES_ID })

        if (!rankImages) {
            rankImages = {
                id: RANK_IMAGES_ID,
            }
            VALID_RANKS.forEach(rank => {
                rankImages[rank] = ""
            })
            await Banner.insert(rankImages)
        }

        return res.json(success({ rankImages }))
    }

    if (req.method === "POST") {
        const { id, img, position } = req.body

        if (id !== RANK_IMAGES_ID) {
            return res.json(error("Identificador inválido para imágenes de rangos"))
        }

        if (!VALID_RANKS.includes(position)) {
            return res.json(error("Rango no válido"))
        }

        if (!img || typeof img !== "string") {
            return res.json(error("La imagen del rango es requerida"))
        }

        const updateData = { [position]: img }
        const existingBanner = await Banner.findOne({ id: RANK_IMAGES_ID })

        if (existingBanner) {
            await Banner.update({ id: RANK_IMAGES_ID }, updateData)
        } else {
            const newRankImages = {
                id: RANK_IMAGES_ID,
            }
            VALID_RANKS.forEach(rank => {
                newRankImages[rank] = ""
            })
            newRankImages[position] = img
            await Banner.insert(newRankImages)
        }

        return res.json(success())
    }
}

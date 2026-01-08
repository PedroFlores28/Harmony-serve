import db  from "../../../components/db-optimized"
import lib from "../../../components/lib"

const { User, Session, Tree } = db
const { error, success, midd } = lib

const pos = {
  'none':             -1,
  'active':            0,
  'star':              1,
  'master':            2,
  'silver':            3,
  'gold':              4,
  'sapphire':          5,
  'RUBI':              6,
  'DIAMANTE':          7,
  'DOBLE DIAMANTE':    8,
  'TRIPLE DIAMANTE':   9,
  'DIAMANTE ESTRELLA': 10,
}

export default async (req, res) => {
  try {
    await midd(req, res)

    let { session, id } = req.query

    // valid session
    session = await Session.findOne({ value: session })
    if(!session) return res.json(error('invalid session'))

    // Si no se pasa id, usar el nodo raíz
    if (!id || id === 'null') id = session.id

    // Ejecutar consultas principales en paralelo
    const [user, node] = await Promise.all([
      User.findOne({ id: session.id }),
      Tree.findOne({ id })
    ])

    if (!node) return res.json(error('node not found'))

    // Traer datos de usuario para el nodo
    const nodeUser = await User.findOne({ id: node.id })
    if (!nodeUser) return res.json(error('user not found'))

    // Traer los hijos inmediatos en paralelo si existen
    let children = []
    let children_points = []
    
    if (node.childs && node.childs.length > 0) {
      // Limitar a 50 hijos para evitar sobrecarga
      const limitedChilds = node.childs.slice(0, 50)
      
      const [childNodes, childUsers] = await Promise.all([
        Tree.find({ id: { $in: limitedChilds } }),
        User.find({ id: { $in: limitedChilds } })
      ])

      // Ordenar según el orden original
      const childNodesOrdered = limitedChilds.map(cid => childNodes.find(n => n.id === cid))
      const childUsersOrdered = limitedChilds.map(cid => childUsers.find(u => u.id === cid))

      // Mapear hijos con datos de usuario
      children = childNodesOrdered.map((childNode, idx) => {
        const childUser = childUsersOrdered[idx] || {}
        return {
          id: childNode.id,
          childs: childNode.childs,
          name: childUser.name,
          lastName: childUser.lastName,
          affiliated: childUser.affiliated,
          activated: childUser.activated,
          points: Number(childUser.points) || 0,
          affiliation_points: childUser.affiliation_points || 0,
          photo: childUser.photo,
          country: childUser.country,
          dni: childUser.dni,
          phone: childUser.phone,
          email: childUser.email,
          _rank: childUser.rank,
        }
      })

      // Calcular puntos grupales
      children_points = childUsersOrdered.map(childUser => childUser && childUser.total_points || 0)
    }

    // Nodo principal con datos de usuario
    const mainNode = {
      id: node.id,
      childs: node.childs,
      name: nodeUser.name,
      lastName: nodeUser.lastName,
      affiliated: nodeUser.affiliated,
      activated: nodeUser.activated,
      points: Number(nodeUser.points) || 0,
      affiliation_points: nodeUser.affiliation_points || 0,
      photo: nodeUser.photo,
      country: nodeUser.country,
      dni: nodeUser.dni,
      phone: nodeUser.phone,
      email: nodeUser.email,
      _rank: nodeUser.rank,
      total_points: nodeUser.total_points || 0,
    }

    return res.json(success({
      node: mainNode,
      children,
      children_points,
    }))
  } catch (error) {
    console.error('Tree error:', error)
    return res.status(500).json(error('Internal server error'))
  }
}

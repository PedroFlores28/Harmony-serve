import db  from "../../../components/db-optimized"
import lib from "../../../components/lib"

const { User, Session, Transaction, Tree, Banner, Plan, DashboardConfig } = db
const { error, success, acum, midd,model } = lib

const D = ['id', 'name', 'lastName', 'affiliated', 'activated', 'tree', 'email', 'phone', 'address', 'rank', 'points', 'parentId', 'total_points']
export default async (req, res) => {
  try {
    await midd(req, res)

    let { session } = req.query

    // valid session
    session = await Session.findOne({ value: session })
    if(!session)  return res.json(error('invalid session'))
    
    // Ejecutar todas las consultas en paralelo usando la misma conexión
    const [
      plans,
      user,
      directs,
      node,
      banner,
      dashboardConfig
    ] = await Promise.all([
      Plan.find({}), // Traer todos los planes
      User.findOne({ id: session.id }),
      User.findByParentId(session.id, 100), // Limitar a 100 directos
      Tree.findOne({ id: session.id }),
      Banner.findOne({}),
      // Optimizar búsqueda de configuración
      DashboardConfig.findOne({ id: 'travel_bonus', userId: session.id })
    ])

    // Si no hay configuración específica del usuario, buscar global
    let finalDashboardConfig = dashboardConfig;
    if (!finalDashboardConfig) {
      finalDashboardConfig = await DashboardConfig.findOne({ 
        id: 'travel_bonus', 
        userId: { $exists: false }
      })
    }

    // Si no existe ninguna configuración, crear una global por defecto
    if (!finalDashboardConfig) {
      finalDashboardConfig = {
        id: 'travel_bonus',
        text: 'Tu progreso hacia el Bono Viaje se actualizará próximamente. ¡Sigue trabajando para alcanzar tus objetivos!'
      }
      await DashboardConfig.insert(finalDashboardConfig)
    }

    // Procesar directs con modelo
    const processedDirects = directs.map(direct => {
      const d = model(direct, D)
      return { ...d }
    })

    // Obtener frontales si hay hijos en el árbol
    let frontals = []
    if (node && node.childs && node.childs.length > 0) {
      frontals = await User.findByIds(node.childs)
    }

    // Optimizar consulta de transacciones usando aggregation
    const transactionData = await Transaction.findUserTransactions(user.id)
    
    // Procesar resultados de transacciones
    let ins = 0, outs = 0, insVirtual = 0, outsVirtual = 0
    
    transactionData.forEach(group => {
      if (group._id === true || group._id === 1) {
        // Virtual transactions
        insVirtual = group.totalIn
        outsVirtual = group.totalOut
      } else {
        // Regular transactions
        ins = group.totalIn
        outs = group.totalOut
      }
    })

    // response
    return res.json(success({
      name:       user.name,
      lastName:   user.lastName,
      affiliated: user.affiliated,
      _activated: user._activated,
      activated:  user.activated,
      plan:       user.plan,
      country:    user.country,
      photo:      user.photo, 
      tree:       user.tree,
      email:      user.email,
      token:      user.token,
      address:   user.address,
      directs: processedDirects,
      frontals,
      banner,
      ins,
      insVirtual,
      outs,
      balance: (ins - outs),
      _balance: (insVirtual - outsVirtual),
      rank:    user.rank,
      points:  user.points,
      plans,
      total_points: user.total_points,
      travelBonusText: finalDashboardConfig.text || 'Tu progreso hacia el Bono Viaje se actualizará próximamente. ¡Sigue trabajando para alcanzar tus objetivos!',
    }))
  } catch (err) {
    console.error('Dashboard error:', err)
    return res.status(500).json(error('Internal server error'))
  }
}

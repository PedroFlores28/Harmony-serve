const cors = require('micro-cors')()

import db  from "../../../components/db-optimized"
import lib from "../../../components/lib"

const { User, Session, Transaction } = db
const { error, success } = lib

const transactions = async (req, res) => {
  try {
    let { session } = req.query

    // valid session
    session = await Session.findOne({ value: session })
    if(!session) return res.json(error('invalid session'))

    // Ejecutar consultas principales en paralelo
    const [user, allTransactions, allUsers] = await Promise.all([
      User.findOne({ id: session.id }),
      Transaction.find({ user_id: session.id }),
      User.find({}).limit(1000) // Limitar usuarios para evitar sobrecarga
    ])

    // Separar transacciones por tipo
    const regularTransactions = allTransactions.filter(t => !t.virtual || t.virtual === null)
    const virtualTransactions = allTransactions.filter(t => t.virtual === true)
    const closedResetTransactions = virtualTransactions.filter(t => t.name === "closed reset")
    const otherVirtualTransactions = virtualTransactions.filter(t => t.name !== "closed reset")

    // Ordenar por fecha
    closedResetTransactions.sort((a, b) => new Date(a.date) - new Date(b.date))
    otherVirtualTransactions.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Identificar transacciones compensadas
    const compensatedTransactionIds = new Set()
    
    for (const resetTransaction of closedResetTransactions) {
      const transactionsAvailableForReset = otherVirtualTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        const resetDate = new Date(resetTransaction.date)
        return transactionDate <= resetDate && !compensatedTransactionIds.has(t.id)
      })
      
      let remainingToCompensate = Math.abs(resetTransaction.value)
      
      for (const transaction of transactionsAvailableForReset) {
        if (remainingToCompensate <= 0) break
        
        if (transaction.type === 'in') {
          if (transaction.value <= remainingToCompensate) {
            compensatedTransactionIds.add(transaction.id)
            remainingToCompensate -= transaction.value
          } else {
            compensatedTransactionIds.add(transaction.id)
            remainingToCompensate = 0
            break
          }
        }
      }
    }
    
    // Filtrar transacciones finales
    const finalTransactions = regularTransactions.filter(transaction => {
      if (compensatedTransactionIds.has(transaction.id)) return false
      return true
    })

    // Enriquecer transacciones con nombres de usuarios (solo si es necesario)
    const enrichedTransactions = finalTransactions.map(transaction => {
      if (transaction._user_id) {
        const u = allUsers.find(e => e.id == transaction._user_id)
        return { ...transaction, user_name: u ? u.name + ' ' + u.lastName : 'Unknown' }
      }
      return transaction
    })

    return res.json(success({
      name: user.name,
      lastName: user.lastName,
      affiliated: user.affiliated,
      _activated: user._activated,
      activated: user.activated,
      plan: user.plan,
      country: user.country,
      photo: user.photo,
      tree: user.tree,
      transactions: enrichedTransactions,
    }))
  } catch (error) {
    console.error('Transactions error:', error)
    return res.status(500).json(error('Internal server error'))
  }
}

module.exports = cors(transactions)

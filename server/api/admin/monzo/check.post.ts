import { checkPayments } from '../../../utils/reconcile'

export default defineEventHandler(event => checkPayments(event, useDb()))

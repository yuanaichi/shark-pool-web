import Index from './views/index/Index.vue'
import Help from './views/Help.vue'

var router = [
	{
		name: 'pool',
		path: '/pool/:pool',
    component: Index,
		title: 'Bitcoineum Mining Pool',
  },
	{
		name: 'index',
		path: '/',
    redirect: {name: 'pool', params: {pool: 'sharkpool1'}}
  },
	{
		name: 'help',
		path: '/help',
		component: Help,
		title: 'Mining Help'
	}
]

export default router;

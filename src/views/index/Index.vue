<template>
  <div id="app">
    <TopHeader />
    <div class="main-cnt">
      <div class="page-container">
        <el-alert
        title="请注意当前为测试版本，有问题到群里反馈。"
        type="warning"
        show-icon>
        </el-alert>
        <h3>{{poolName}}</h3>

          <p>
            合约地址
            <el-tag type="gray">
              <a :href="'https://etherscan.io/address/' + poolContractAddress" target="_blank">{{poolContractAddress}}</a>
            </el-tag>
            ， 提现手续费 <el-tag type="gray"> {{ poolFee }} % </el-tag>
            ， 合约余额 <el-tag type="gray"><strong>{{(poolEthBalance / 10 ** 18).toFixed(4)}}</strong></el-tag> ether
          </p>


          <div class="el-row" style="margin-left: -6px; margin-right: -6px;">
            <div class="el-col el-col-6" style="padding-left: 6px; padding-right: 6px;">
              <div class="pool-box bg-info">
                <span class="value">{{stats.totalUsers}}</span>
                <div class="title">用户数</div>
              </div>
            </div>

            <div class="el-col el-col-6" style="padding-left: 6px; padding-right: 6px;">
              <div class="pool-box bg-warning">
                <span class="value">{{stats.minedBlocks}}</span>
                <div class="title">已挖块</div>
              </div>
            </div>

            <div class="el-col el-col-6" style="padding-left: 6px; padding-right: 6px;">
              <div class="pool-box bg-success">
                <span class="value">{{stats.claimedBlocks}}</span>
                <div class="title">挖到块</div>
              </div>
            </div>

            <div class="el-col el-col-6" style="padding-left: 6px; padding-right: 6px;">
              <div class="pool-box bg-silver">
                <span class="value">{{stats.contractPeriod}}</span>
                <div class="title">挖矿周期</div>
              </div>
            </div>
          </div>

          <h3>开始挖矿</h3>
          <div class="mining">
            <div v-if="web3Error === 'not-install'">
              <p>
                请先安装
                <el-tag type="gray">Parity</el-tag> or <el-tag type="gray"><a href="https://metamask.io/" target="_blank">Metamask</a></el-tag> 插件。
              </p>
              <p>
                请解锁 <el-tag type="gray">Metamask</el-tag> 并刷新页面。
              </p>
            </div>
            <div v-if="web3Error === ''">
              <h5>挖矿账户</h5>
              <p>
                <el-select v-model="selectedAccount" placeholder="请选择挖矿账户" style="width: 100%;" no-data-text="无账户或Metamask未解锁">
                  <el-option
                    v-for="item in accounts"
                    :key="item.account"
                    :label="item.account"
                    :value="item.account">
                    <span style="float: left">{{ item.account }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ (item.eth / 10**18).toFixed(4) }} ETH / {{ (item.bte / 10 ** 8).toFixed(2) }} BTE </span>
                  </el-option>
                </el-select>
              </p>
              <h5>挖矿/赎回</h5>
              <p>
                <el-button :type="mineActionType" @click="selectMiningAction('mine')">Mine</el-button>
                <el-button :type="redeemActionType" @click="selectMiningAction('redeem')">Redeem</el-button>
              </p>
              <h5>高级选项</h5>
              <p>
                GasPrice: <strong class="gas-price-number">{{gasPrice}}</strong> Gwei
                <el-slider v-model="gasPrice" :min=4 :max=22 :show-stops="true"></el-slider>
              </p>
              <div v-if="miningAction === 'mine'">
                <h5>挖矿</h5>
                <el-form :inline="true">
                 <el-form-item>
                   <el-input v-model="burnEther" placeholder="burn ether amount" type="number"><template slot="append">ether</template></el-input>
                 </el-form-item>
                 <el-form-item>
                   <el-button type="primary" @click="startMining()" :disabled="burnEther <= 0 || burnEther > 1000 || miningButtonDisabled">开始挖矿</el-button>
                 </el-form-item>
                </el-form>
              </div>

              <div v-if="miningAction === 'redeem'">
                <h5>赎回BTE</h5>
                <p>
                  <el-button type="primary" @click="redeem()" :disable="redeemButtonDisabled">赎回</el-button>
                </p>
              </div>
            </div>
          </div>
          <h3>用户挖矿信息</h3>
          <p>输入挖矿账户查询用户挖矿信息。</p>
          <el-row>
            <el-col :span="12">
              <el-input
              placeholder="挖矿地址"
              icon="search"
              v-model="searchUserAddress"
              :on-icon-click="handleSearchUser">
              </el-input>
            </el-col>
          </el-row>
          <p v-if="searchUserAddress">
            <a :href="'https://etherscan.io/address/' + searchUserAddress">在区块浏览器中查看</a>
          </p>
          <el-row style="margin-top: 20px;" v-loading.body="userLoading">
            <el-col :span="12" style="padding-right: 6px;">
              <el-card class="box-card miner-info-card">
                  <table class="mining-info">
                    <tr>
                      <td class="name">挖矿进度</td>
                      <td>{{stats.minedBlocks}} / {{user.endBlock}}（{{miningProcess()}}）</td>
                    </tr>
                    <tr>
                      <td class="name">贡献比例</td>
                      <td>
                        {{(user.proportionalContribution / 10 ** 18).toFixed(4)}} ether</td>
                    </tr>
                    <tr>
                      <td class="name">总销毁</td>
                      <td>{{(user.totalBurnEther / 10 ** 18).toFixed(4)}} ether</td>
                    </tr>
                    <tr>
                      <td class="name">待销毁</td>
                      <td>{{(user.remainingBurnEther / 10 ** 18).toFixed(4)}} ether</td>
                    </tr>
                  </table>
              </el-card>
            </el-col>

            <el-col :span="12"  style="padding-left: 6px;">
              <el-card class="box-card">
                <table class="mining-info">
                  <tr>
                    <td class="name">待赎回BTE</td>
                    <td>{{(user.unReedemBte / 10 ** 8).toFixed(4)}} BTE</td>
                  </tr>
                  <tr>
                    <td class="name">BTE余额</td>
                    <td>{{(user.bteBalance / 10 ** 8).toFixed(4)}} BTE</td>
                  </tr>
                  <tr>
                    <td class="name">ETH余额</td>
                    <td>{{(user.ethBalance / 10 ** 18).toFixed(4)}} ether</td>
                  </tr>
                  <tr>
                    <td class="name">销毁成本</td>
                    <td>{{user.bteCost}} ether</td>
                  </tr>
                </table>
              </el-card>
            </el-col>
          </el-row>
      </div>
    </div>
    <Foot />
  </div>
</template>

<script>
import TopHeader from '../../components/TopHeader.vue'
import Foot from '../../components/Footer.vue'
import {default as Web3} from 'web3'

window.defaultWeb3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"))
window.defaultWeb3.currentProvider.isDefaultProvider = true

window.addEventListener('load', function() {
  if (typeof window.web3 !== 'undefined') {
    window.web3 = new Web3(window.web3.currentProvider)
  } else {
    // set the provider you want from Web3.providers
    window.web3 = defaultWeb3
  }
})

export default {
  components: {
    TopHeader,
    Foot
  },
  data () {
    return {
      accounts: [],
      web3Error: 'not-install',
      gasPrice: 4,
      poolContracts: {
        sharkpool1: {
          poolContractAddress: "0x2918DAF5b7c6Cd43E3C9Fce08b3Bde11B09A15B5",
          poolName: "SharkPool-1",
        },
        sharkpool2: {
          poolContractAddress: "0x6cD239a7717c1639214880e53f38F47C99d6cFFC",
          poolName: "SharkPool-2"
        },
      },
      poolId: 'sharkpool1',
      poolName:"SharkPool",
      poolContractAddress: "",
      poolContractABI:[{"constant":true,"inputs":[],"name":"current_external_block","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"claimed_blocks","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"slots_used","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"calculate_minimum_contribution","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pool_name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_paused","type":"bool"}],"name":"pool_set_paused","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"attempts","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get_total_attempt","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"available_slots","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"divisible_units","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"allocated_slots","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_sender","type":"address"}],"name":"checkMiningAttempt","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"mine","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_who","type":"address"}],"name":"find_contribution","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"users","outputs":[{"name":"end_block","type":"uint256"},{"name":"proportional_contribution","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"blockCreationRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_percentage","type":"uint8"}],"name":"pool_set_percentage","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"mined_blocks","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"max_users","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isPaused","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get_bitcoineum_contract_address","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"redeem","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"contract_period","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"checkWinning","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_blockNumber","type":"uint256"},{"name":"forCreditTo","type":"address"}],"name":"claim","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pool_percentage","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"total_users","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"active_users","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_externalBlockNum","type":"uint256"}],"name":"external_to_internal_block_number","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_info","type":"string"},{"indexed":false,"name":"_data","type":"uint256"}],"name":"LogEvent","type":"event"}],
      bteContractAddress: '0x73dD069c299A5d691E9836243BcaeC9c8C1D8734',
      bteContractABI: [{"constant":true,"inputs":[],"name":"current_external_block","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"maximumSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalWeiCommitted","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_totalBlocksMined","type":"uint256"}],"name":"calculate_base_mining_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"getBlockData","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"bool"},{"name":"","type":"address"},{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"lastDifficultyAdjustmentEthereumBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"minimumDifficultyThresholdWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_totalWeiCommitted","type":"uint256"},{"name":"_totalWeiExpected","type":"uint256"},{"name":"_minimumDifficultyThresholdWei","type":"uint256"},{"name":"_difficultyScaleMultiplierLimit","type":"uint256"}],"name":"calculate_next_expected_wei","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"MAX_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_externalblock","type":"uint256"}],"name":"checkBlockMature","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"targetBlockNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalBlocksMined","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"difficulty","type":"uint256"},{"name":"offset","type":"uint256"}],"name":"calculate_range_attempt","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"divisible_units","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"checkMiningActive","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"resolve_block_hash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_totalBlocksMined","type":"uint256"},{"name":"_sender","type":"address"},{"name":"_blockNumber","type":"uint256"}],"name":"calculate_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"burnAddress","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"blockData","outputs":[{"name":"targetDifficultyWei","type":"uint256"},{"name":"blockNumber","type":"uint256"},{"name":"totalMiningWei","type":"uint256"},{"name":"totalMiningAttempts","type":"uint256"},{"name":"currentAttemptOffset","type":"uint256"},{"name":"payed","type":"bool"},{"name":"payee","type":"address"},{"name":"isCreated","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getContractState","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"initial_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_sender","type":"address"}],"name":"checkMiningAttempt","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"targetDifficultyWei","type":"uint256"},{"name":"totalMiningWei","type":"uint256"},{"name":"value","type":"uint256"}],"name":"calculate_difficulty_attempt","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"mine","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_who","type":"address"}],"name":"getMiningAttempt","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"address"}],"name":"miningAttempts","outputs":[{"name":"projectedOffset","type":"uint256"},{"name":"value","type":"uint256"},{"name":"isCreated","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"difficultyScaleMultiplierLimit","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"blockCreationRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"currentDifficultyWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_baseReward","type":"uint256"},{"name":"_userContributionWei","type":"uint256"},{"name":"_totalCommittedWei","type":"uint256"}],"name":"calculate_proportional_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_externalblock","type":"uint256"}],"name":"checkRedemptionWindow","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalWeiExpected","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get_internal_block_number","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"checkWinning","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_blockNumber","type":"uint256"},{"name":"forCreditTo","type":"address"}],"name":"claim","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"difficultyAdjustmentPeriod","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transmute","outputs":[{"name":"","type":"bool"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"isBlockRedeemed","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_externalBlockNum","type":"uint256"}],"name":"external_to_internal_block_number","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"rewardAdjustmentPeriod","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"},{"indexed":false,"name":"baseContract","type":"address"},{"indexed":false,"name":"transmutedContract","type":"address"},{"indexed":false,"name":"sourceQuantity","type":"uint256"},{"indexed":false,"name":"destQuantity","type":"uint256"}],"name":"Transmuted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":false,"name":"_value","type":"uint256"},{"indexed":true,"name":"_blockNumber","type":"uint256"},{"indexed":false,"name":"_totalMinedWei","type":"uint256"},{"indexed":false,"name":"_targetDifficultyWei","type":"uint256"}],"name":"MiningAttemptEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_info","type":"string"}],"name":"LogEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_forCreditTo","type":"address"},{"indexed":false,"name":"_reward","type":"uint256"},{"indexed":true,"name":"_blockNumber","type":"uint256"}],"name":"BlockClaimedEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}],
      burnEther: 0,
      selectedAccount: '',
      miningButtonDisabled: false,
      redeemButtonDisabled: false,
      miningAction: 'mine',
      mineActionType: 'success',
      redeemActionType: 'default',
      searchUserAddress: '',
      user: {
        endBlock: 0,
        bteBalance: 0,
        ethBalance: 0,
        proportionalContribution: 0,
        totalBurnEther: 0,
        remainingBurnEther: 0,
        bteCost: 0,
        unReedemBte: 0
      },
      userLoading: false,
      poolFee: 0,
      stats: {
        minedBlocks: 0,
        claimedBlocks: 0,
        totalUsers: 0,
        contractPeriod: 0
      },
      poolEthBalance: 0
    }
  },
  watch: {
    '$route' (to, from) {
      this.poolId = to.params.pool
      this.$message.info('正在切换至矿池' + this.poolContracts[this.poolId].poolName)
      this.loadPool()
    }
  },
  computed: {
  },
  created () {
    // 组件创建完后获取数据，
    // 此时 data 已经被 observed 了
    //web3 is undefined
  },
  mounted () {
    var self = this
    var t = setInterval(function() {
      if (window.web3) {
        clearInterval(t)
        self.loadPool()
      }
    }, 1000)
  },
  destroyed () {
  },
  methods: {
    getPoolInstance() {
      return window.web3.eth.contract(this.poolContractABI).at(this.poolContractAddress)
    },
    getDefaultPoolInstance() {
      return window.defaultWeb3.eth.contract(this.poolContractABI).at(this.poolContractAddress)
    },
    getBteInstance() {
      return window.defaultWeb3.eth.contract(this.bteContractABI).at(this.bteContractAddress)
    },
    resetPool() {
      this.accounts = []
      this.selectedAccount = ''
      this.user = {
        endBlock: 0,
        bteBalance: 0,
        ethBalance: 0,
        proportionalContribution: 0,
        totalBurnEther: 0,
        remainingBurnEther: 0,
        bteCost: 0,
        unReedemBte: 0
      }
      this.poolFee =  0
      this.stats = {
        minedBlocks: 0,
        claimedBlocks: 0,
        totalUsers: 0,
        contractPeriod: 0
      }
      this.poolEthBalance = 0
    },
    loadPool (pool) {
      var self = this
      this.resetPool()
      //set pool contract
      self.poolContractAddress = self.poolContracts[this.poolId].poolContractAddress
      self.poolName = self.poolContracts[this.poolId].poolName

      var poolInstance = this.getPoolInstance()
      var defaultPoolInstance = this.getDefaultPoolInstance()
      var bteInstance = this.getBteInstance()

      if (!window.web3.currentProvider.isDefaultProvider) {
        this.web3Error = ''
        // metamask or parity
        //load accounts
        for (var i in web3.eth.accounts) {
          var account = web3.eth.accounts[i];

          (function(account) {
            web3.eth.getBalance(account, (a, ethBalance) => {
              bteInstance.balanceOf.call(account, (err, bteBalance) => {
                self.accounts.push({
                  account: account,
                  label: account.substr(0, 6) + '...' + account.substr(-3),
                  eth: ethBalance.toNumber(),
                  bte: bteBalance.toNumber()
                })
              })
            })
          })(account);
        }
      } else {
        this.web3Error = 'not-install'
      }

      //pool fee
      defaultPoolInstance.pool_percentage((err, pool_percentage) => {
        self.poolFee = pool_percentage.toNumber()
      })

      defaultPoolInstance.slots_used((err, slots_used) => {
        self.stats.totalUsers = slots_used.toNumber()
      })

      defaultPoolInstance.mined_blocks((err, mined_blocks) => {
        self.stats.minedBlocks = mined_blocks.toNumber()
      })

      defaultPoolInstance.claimed_blocks((err, claimed_blocks) => {
        self.stats.claimedBlocks = claimed_blocks.toNumber()
      })

      defaultPoolInstance.contract_period((err, contract_period) => {
        self.stats.contractPeriod = contract_period.toNumber()
      })

      window.defaultWeb3.eth.getBalance(this.poolContractAddress, (err, balance) => {
        self.poolEthBalance = balance.toNumber()
      })

      this.searchUserAddress = window.STORAGE.getItem('searchUserAddress_' + this.poolId)

      if (this.searchUserAddress) {
        this.handleSearchUser()
      }
    },
    startMining() {
      var self = this
      if (this.burnEther < 0.01 || this.burnEther > 1000) {
        this.$message({
          message: '销毁的ether数量要大于0.01, 小于1000ether',
          type: 'warning'
        })
        return
      }

      if (!this.selectedAccount) {
        this.$message.error('请先选择账户')
        this.redeemButtonDisabled = false
        return
      }

      var defaultPoolInstance = this.getDefaultPoolInstance()

      var transObj = {
        to: this.poolContractAddress,
        gasPrice: web3.toWei(this.gasPrice, 'gwei'),
        gas: 150000,
        value: web3.toWei(this.burnEther, 'ether'),
        from: this.selectedAccount
      }

      this.miningButtonDisabled = true

      var contribution = defaultPoolInstance.find_contribution(this.searchUserAddress)
      var remainingEther = web3.fromWei(contribution[3].toNumber(), 'ether')
      var totalBurnEther = parseFloat(this.burnEther) + parseFloat(remainingEther)
      var content = '本次销毁：' + this.burnEther  + ' ether，上次剩余：' + remainingEther +' ether, 共销毁：' + totalBurnEther + ' ether， 预计每份销毁： ' + (totalBurnEther / 100).toFixed(4) + ' ether'
      var transactionHash = '0x565ec265e330918b7a2bb0d9f49eb9ab05327910bf87c3234005aec2fc297ff3'
      const h = this.$createElement;
      this.$confirm(content, 'Confirmation', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        window.web3.eth.sendTransaction(transObj, (err, transactionHash) => {
          if (err) {
            this.$message.error('交易失败：' + err)
          } else {
              this.$alert(h('p', null,[h('p', null, '交易成功等待网络确认， 交易hash：'), h('br'), h('a', {attrs: {href: 'https://etherscan.io/tx/' + transactionHash, target: '_blank'}}, transactionHash.substr(0, 15) + '...' + transactionHash.substr(-6))]), '交易成功', {
                confirmButtonText: '确定',
                callback: action => {

                }
              });
          }
          self.miningButtonDisabled = false
        })
      }).catch(() => {
          self.miningButtonDisabled = false
      })
    },
    selectMiningAction (action) {
      this.miningAction = action
      if (action == 'mine') {
        this.mineActionType = 'success'
        this.redeemActionType = 'default'
      } else {
        this.mineActionType = 'default'
        this.redeemActionType = 'success'
      }
    },
    redeem() {
      this.redeemButtonDisabled = true
      var self = this
      var defaultPoolInstance = this.getDefaultPoolInstance()
      if (!this.selectedAccount) {
        this.$message.error('请先选择账户')
        this.redeemButtonDisabled = false
        return
      }

      // check balance
      var userBteBalance = defaultPoolInstance.balanceOf.call(this.selectedAccount).toNumber()
      if (userBteBalance <= 0) {
        this.$message.error('用户BTE余额为0，无需赎回')
        this.redeemButtonDisabled = false
        return
      }

      var poolInstance = this.getPoolInstance()
      var content = '赎回 ' + (userBteBalance / 10 ** 8).toFixed(2) + ' BTE'
      const h = this.$createElement;

      this.$confirm(content, 'Confirmation', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        poolInstance.redeem({
          from: this.selectedAccount,
          gas: 120000,
          value: 0,
  				gasPrice: web3.toWei(this.gasPrice, 'gwei')
        }, (err, transactionHash) => {
          if (err) {
            this.$message.error('赎回失败：' + err)
          } else {
            this.$alert(h('p', null,[h('p', null, '赎回成功等待网络确认， 交易hash：'), h('br'), h('a', {attrs: {href: 'https://etherscan.io/tx/' + transactionHash, target: '_blank'}}, transactionHash.substr(0, 15) + '...' + transactionHash.substr(-6))]), '交易成功', {
              confirmButtonText: '确定',
              callback: action => {
              }
            });
          }
          self.redeemButtonDisabled = false
        })

      }).catch(() => {
        self.redeemButtonDisabled = false
      })
    },
    handleSearchUser(ev) {
      var self = this

      if (!this.searchUserAddress) {
        this.$message({
          message: '请填写挖矿账户',
          type: 'warning'
        })
        return
      }
      window.STORAGE.setItem('searchUserAddress_' + this.poolId, this.searchUserAddress)
      var poolInstance = this.getDefaultPoolInstance()
      this.userLoading = true

      poolInstance.find_contribution(this.searchUserAddress, (err, contribution) => {
          self.user.endBlock = contribution[0].toNumber()
          self.user.proportionalContribution = contribution[1].toNumber()
          self.user.totalBurnEther = contribution[2].toNumber()
          self.user.remainingBurnEther = contribution[3].toNumber()

          self.user.bteCost = self.getBteCost()
          self.userLoading = false
      })

      window.defaultWeb3.eth.getBalance(this.searchUserAddress, (err, balance) => {
        self.user.ethBalance = balance.toNumber()
        self.user.bteCost = self.getBteCost()
      })

      poolInstance.balanceOf(this.searchUserAddress, (err, balance) => {
        self.user.unReedemBte = balance.toNumber()
        self.user.bteCost = self.getBteCost()
      })

      this.getBteInstance().balanceOf(this.searchUserAddress, (err, balance) => {
        self.user.bteBalance = balance.toNumber()
      })
    },
    getBteCost() {
      if (this.user.unReedemBte > 0) {
        return ((this.user.totalBurnEther -  this.user.remainingBurnEther) / this.user.unReedemBte / 10 ** 10).toFixed(4)
      }
      return 0
    },
    miningProcess () {
      if (this.user.endBlock == 0) {
        return '没有挖矿'
      }

      if (this.user.endBlock > this.stats.minedBlocks) {
        return '正在挖矿'
      } else {
        return '挖矿结束'
      }
    }
  }
}
</script>

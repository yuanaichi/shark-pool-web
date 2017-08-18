<template>
  <div class="headerWrapper">
    <header class="header">
      <div class="container">
        <h1>
          <a href="/" class="router-link-active">
            SharkPool
          </a>
          <sup>beta</sup>
        </h1>
        <div class="nav" style="float: right;">
        <el-menu mode="horizontal">
          <el-menu-item index="1"><router-link :to="{ name: 'pool', params: {pool: 'sharkpool1'}}">SharkPool1</router-link></el-menu-item>
          <el-menu-item index="2"><router-link :to="{ name: 'pool', params: {pool: 'sharkpool2'}}">SharkPool2</router-link></el-menu-item>
          <el-menu-item index="3"><router-link :to="{ name: 'help'}">Help</router-link></el-menu-item>
        </el-menu>
        </div>
      </div>
    </header>
  </div>
</template>

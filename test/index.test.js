'use strict'

const sinon = require('sinon')
const test = require('tap').test
const ebs = require('../src/index')

function getClient () {
  return {
    bulk: function (params, callback) {}
  }
}

test('index single doc', t => {
  t.plan(3)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 2)
    t.deepEqual(data.body[0], { index: { _index: 'myindex', _type: 'mytype', _id: '12345' } })
    t.deepEqual(data.body[1], { name: 'test' })
  })
  const writeStream = ebs.bulkWriteStream({ client })
  const input = { index: 'myindex', type: 'mytype', id: '12345', action: 'index', doc: { name: 'test' } }
  writeStream.write(input)
  writeStream.end()
})

test('update single doc', t => {
  t.plan(3)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 2)
    t.deepEqual(data.body[0], { update: { _index: 'myindex', _type: 'mytype', _id: '12345' } })
    t.deepEqual(data.body[1], { doc: { name: 'test' } })
  })
  const writeStream = ebs.bulkWriteStream({ client })
  const input = { index: 'myindex', type: 'mytype', id: '12345', action: 'update', doc: { name: 'test' } }
  writeStream.write(input)
  writeStream.end()
})

test('Upsert single doc', t => {
  t.plan(2)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 2)
    t.deepEqual(data.body[1], { doc: { name: 'test' }, doc_as_upsert: true })
  })
  const writeStream = ebs.bulkWriteStream({ client })
  writeStream.write({ index: 'myindex', type: 'mytype', id: '12345', action: 'upsert', doc: { name: 'test' } })
  writeStream.end()
})

test('delete single doc', t => {
  t.plan(2)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 1)
    t.deepEqual(data.body[0], { delete: { _index: 'myindex', _type: 'mytype', _id: '12345' } })
  })
  const writeStream = ebs.bulkWriteStream({ client })
  const input = { index: 'myindex', type: 'mytype', id: '12345', action: 'delete', doc: { name: 'test' } }
  writeStream.write(input)
  writeStream.end()
})

test('ignore invalid action', t => {
  t.plan(1)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 0)
  })
  const writeStream = ebs.bulkWriteStream({ client })
  const input = { index: 'myindex', type: 'mytype', id: '12345', action: 'ignore', doc: { name: 'test' } }
  writeStream.write(input)
  writeStream.end()
})

test('ignore missing arguments', t => {
  t.plan(1)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 0)
  })
  const writeStream = ebs.bulkWriteStream({ client })
  writeStream.write({ index: null, type: 'mytype', id: '12345', action: 'index', doc: { name: 'test' } })
  writeStream.write({ index: 'myindex', type: 'mytype', id: null, action: 'index', doc: { name: 'test' } })
  writeStream.write({ index: 'myindex', type: 'mytype', id: '12345', action: 'index', doc: null })
  writeStream.end()
})

test('type is optional', t => {
  t.plan(1)

  const client = getClient()
  sinon.stub(client, 'bulk').callsFake((data, callback) => {
    t.equal(data.body.length, 4)
  })
  const writeStream = ebs.bulkWriteStream({ client })
  writeStream.write({ index: 'myindex', type: 'mytype', id: '12345', action: 'index', doc: { name: 'test' } })
  writeStream.write({ index: 'myindex', type: null, id: '12345', action: 'index', doc: { name: 'test' } })
  writeStream.end()
})

test('throws on missing client', t => {
  t.plan(1)

  try {
    const writeStream = ebs.bulkWriteStream()
    t.fail('Should throw on missing credentials')
    writeStream.write()
  } catch (err) {
    t.ok(true)
  }
})

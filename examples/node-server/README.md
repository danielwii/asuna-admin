
### Develop

```bash
yarn asuna docker -d -b REGISTRY=https://registry.npm.taobao.org
docker run --rm -it -v ${PWD}/services:/asuna-admin/services -p 3000:3000 -e PROXY_API=http://server-host:port asuna-admin
```

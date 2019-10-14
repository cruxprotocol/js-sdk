## Nodes Setup

####Prerequisite

* [Docker](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04)
* [Nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-16-04) 
* [Certbot](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)
* [S3 Bucket](https://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html)
* Domain for BNS
* Domain for Gaia Hub

### BNS Node

#### Recommended Infrastructure 
- 4 GB RAM
- 100 GB Disk Space

#### Setup
The following steps will spin up a BNS node.
_You will need `sudo` access to run the below scripts_
* Clone BNS node and build docker image
```shell
$ git clone git@github.com:blockstack/blockstack-core.git
$ cd blockstack-core
$ docker build -t blockstack-core:master .
```
* Create directory to store Blockstack data and run the docker
```
$ export BLOCKSTACK_DATA_DIR="/var/blockstack-core-data"
$ mkdir -p "$BLOCKSTACK_DATA_DIR"
$ docker run \
   -v $BLOCKSTACK_DATA_DIR:/root/.blockstack-server \
   -p 6264:6264 \  
   -p 6270:6270 \
   blockstack-core:master
```
* Port 6264 is used by BNS node to communicate with other BNS nodes on the network
* Port 6270 is used to interact with this BNS node  

* These commands will fast-sync and run a Blockstack Core node in about 15
minutes.  The state for the Blockstack Core node will be stored to
`$BLOCKSTACK_DATA_DIR`.  You can see the node's logs with `docker logs -f` or with
`tail -f "$BLOCKSTACK_DATA_DIR/blockstack-server.log"`.

### Gaia Hub 

####Setup

* Make a folder `$HOME/hub` and copy the below configuration to `$HOME/hub/config.json` and add in your desired configuration. 
````
{
  "servername": "hub.example.com",
  "port": "3000",
  "driver": "aws",
  "bucket": "gaia.example.com",
  "readURL": "https://gaia.example.com/",
  "cacheControl": "public, max-age=1",
  "pageSize": 20,
  "diskSettings": {
    "storageRootDirectory": "/tmp/gaia-disk"
  },
  "awsCredentials": {
    "accessKeyId": "",
    "secretAccessKey": ""
  },

  "argsTransport": {
    "level": "debug",
    "handleExceptions": true,
    "stringify": true,
    "timestamp": true,
    "colorize": true,
    "json": true
  }
}
````
* `servername`: Optional placeholder for server's name
*  `driver`: Supported drivers for linking storage layer to Gaia. The example config uses `aws` as the driver. Gaia Hub currently supports the following drivers:
````
'aws' == Amazon S3
'azure' == Azure Blob Storage
'disk' == Local disk (you must set up static web-hosting to point at this driver)
'google-cloud' === Google Cloud Storage
````
* `bucket`: Name of the S3 bucket
* `readURL`: URL from where Gaia hub could read S3 storage files. This is bound to the domain of the Gaia Hub. The example config uses `https://gaia.example.com/` as readURL domain.
* `awsCredentials`: User credentials of AWS instance which requires `accessKeyId` & `secretAccessKey`
* Update the `Bucket Policy` of S3 instance (under `Permissions`) with the following config: 
````
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::gaia.example.com/*"
        }
    ]
}
```` 
* Copy below code to `$HOME/hub/nginx.conf` and replace `hub.example.com` with your domain.

````
  
limit_req_zone $binary_remote_addr zone=std_rl:10m rate=10r/s;
limit_req zone=std_rl burst=10 nodelay;

upstream gaia_hub {
  server localhost:3000;
}

server {
  listen       80;
  server_name  hub.example.com;

  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;
    proxy_redirect off;
    proxy_pass http://gaia_hub;
    break;
  }
}
````

- `sudo rm /etc/nginx/sites-enabled/default && sudo ln $HOME/hub/nginx.conf /etc/nginx/sites-enabled/default`
- Finish `certbot` setup and cert generation
- Pull the docker image and start an instance of the container:

```bash
$ docker pull quay.io/blockstack/gaia-hub:latest
$ docker run -d --restart=always -v $HOME/hub/config.json:/src/hub/config.json -p 3000:3000 -e CONFIG_PATH=/src/hub/config.json quay.io/blockstack/gaia-hub:latest
# Now you can test the hub! The exact output will depend on your configuration
$ curl https://hub.example.com/hub_info | jq
{
  "challenge_text": "[\"gaiahub\",\"2017-09-19\",\"{{ .serverName }}\",\"blockstack_storage_please_sign\"]",
  "read_url_prefix": "https://{{ .bucketName }}.{{ .storageProviderUrl }}/"
}
```
 ## Setting Nginx Configurations
* Point the domain to the host's IP
* SSH to the host and edit the Nginx configuration file for our application

    `nano /etc/nginx/sites-available/default`
    

````
server {
    listen       80;
    server_name  domain;

    location / {
        proxy_pass   http://localhost:6270/;
    }
}

server {
    listen       443 ssl;
    server_name  domain;

    ssl_certificate     /etc/letsencrypt/live/domain/fullchain.pem; #Replace the certificate keys if you already have them and don't want to generate new pair 
    ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_pass   http://localhost:6270/;
    }
}
````
* This routes every request that came through port 80 for that domain to the BNS docker

## Obtaining the certificate

* SSH to the host machine 
* Run the following command
````
docker run --rm -it -v "/root/letsencrypt/log:/var/log/letsencrypt" -v "/var/www/html/shared:/var/www/" -v "/etc/letsencrypt:/etc/letsencrypt" -v "/root/letsencrypt/lib:/var/lib/letsencrypt" lojzik/letsencrypt certonly --webroot --webroot-path /var/www --email EMAIL -d domain
```` 

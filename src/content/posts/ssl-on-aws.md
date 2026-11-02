---
title: "SSL on AWS"
date: 2015-08-07
summary: "Installing a trusted certificate on an EC2 Apache box."
tags:
  - "AWS"
  - "Apache"
  - "DevOps"
legacyPath: /2015/08/07/ssl-on-aws/
condensed: true
---

The 2015 way to put a paid certificate on an EC2 instance running Apache:

```bash
cd /etc/pki/tls/private/
sudo openssl genrsa -out domain.pem 2048
sudo openssl req -sha256 -new -key domain.pem -out domain.csr
# buy + validate the cert, drop it in /etc/pki/tls/certs/
# point SSLCertificateFile / KeyFile / ChainFile at it in conf.d/ssl.conf
sudo service httpd restart
```

On Ubuntu it's the same idea with `apt-get` and `a2ensite`. These days: just use Let's Encrypt, or put it on a platform that does certificates for you.

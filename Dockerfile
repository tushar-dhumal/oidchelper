FROM icr.io/appcafe/websphere-liberty:25.0.0.6-kernel-java21-openj9-ubi-minimal
RUN /opt/ibm/wlp/bin/installUtility install servlet-6.0 webCache-1.0 transportSecurity-1.0
COPY static-web/ /config/apps/oidchelper/
COPY server.xml /config/
EXPOSE 9080
CMD ["/opt/ibm/wlp/bin/server", "run", "defaultServer"]